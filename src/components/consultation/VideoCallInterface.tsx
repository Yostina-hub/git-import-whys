import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Monitor,
  MonitorOff,
  MessageSquare,
  FileText,
  Pill,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface VideoCallInterfaceProps {
  roomId: string;
  userId: string;
  userName: string;
  onEndCall: () => void;
  onOpenChat: () => void;
  onOpenPrescription: () => void;
  onOpenNotes: () => void;
}

export function VideoCallInterface({
  roomId,
  userId,
  userName,
  onEndCall,
  onOpenChat,
  onOpenPrescription,
  onOpenNotes,
}: VideoCallInterfaceProps) {
  const { toast } = useToast();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remotePeerIdRef = useRef<string | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const politeRef = useRef(false);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect to signaling server
      const wsUrl = `wss://obbyvxodxvgdaarzmsbd.functions.supabase.co/webrtc-signaling?roomId=${roomId}&userId=${userId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to signaling server');
        setupPeerConnection();
      };

      wsRef.current.onmessage = handleSignalingMessage;

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to signaling server',
          variant: 'destructive',
        });
      };
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: 'Media Error',
        description: 'Failed to access camera/microphone',
        variant: 'destructive',
      });
    }
  };

  // ICE servers configuration with optional TURN via env
  const getIceServers = () => {
    const servers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
    const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
    const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;
    if (turnUrl && turnUsername && turnCredential) {
      servers.push({ urls: turnUrl, username: turnUsername, credential: turnCredential });
    }
    return servers;
  };

  const setupPeerConnection = () => {
    const configuration: RTCConfiguration = {
      iceServers: getIceServers(),
      iceCandidatePoolSize: 4,
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteConnected(true);
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN && remotePeerIdRef.current) {
        console.log('Sending ICE candidate to:', remotePeerIdRef.current);
        wsRef.current.send(
          JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            targetId: remotePeerIdRef.current,
          })
        );
      }
    };

    // Auto negotiate when needed
    peerConnectionRef.current.onnegotiationneeded = async () => {
      try {
        if (!peerConnectionRef.current) return;
        if (!remotePeerIdRef.current) return;
        if (peerConnectionRef.current.signalingState !== 'stable') {
          console.log('Skip negotiationneeded: signaling not stable');
          return;
        }
        console.log('Negotiation needed - creating offer');
        makingOfferRef.current = true;
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        wsRef.current?.send(
          JSON.stringify({ type: 'offer', offer, targetId: remotePeerIdRef.current })
        );
      } catch (err) {
        console.error('onnegotiationneeded error:', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    // ICE connection state handling with restart on failure
    peerConnectionRef.current.oniceconnectionstatechange = async () => {
      const iceState = peerConnectionRef.current?.iceConnectionState;
      console.log('ICE state:', iceState);
      if (iceState === 'failed' || iceState === 'disconnected') {
        try {
          if (!peerConnectionRef.current) return;
          const offer = await peerConnectionRef.current.createOffer({ iceRestart: true });
          await peerConnectionRef.current.setLocalDescription(offer);
          if (remotePeerIdRef.current) {
            wsRef.current?.send(
              JSON.stringify({ type: 'offer', offer, targetId: remotePeerIdRef.current })
            );
          }
          if (iceState === 'failed') {
            toast({
              title: 'Network issue detected',
              description: 'Connection failed. A TURN server may be required for your network.',
              variant: 'destructive',
            });
          }
        } catch (err) {
          console.error('ICE restart error:', err);
        }
      }
    };

    // Monitor connection state
    peerConnectionRef.current.onconnectionstatechange = () => {
      const state = peerConnectionRef.current?.connectionState;
      console.log('Connection state:', state);

      if (state === 'connected') {
        setRemoteConnected(true);
        setNeedsAudioUnlock(true);
        monitorConnectionQuality();
      } else if (state === 'disconnected' || state === 'failed') {
        setRemoteConnected(false);
      }
    };
  };

  const handleSignalingMessage = async (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    console.log('Received signaling message:', message.type, message);

    switch (message.type) {
      case 'user-connected':
        console.log('User connected:', message.userId);
        // Store the remote peer ID
        if (message.userId !== userId) {
          remotePeerIdRef.current = message.userId;
          // Determine polite peer deterministically (higher userId is polite)
          politeRef.current = userId.localeCompare(message.userId) > 0;
          console.log('Stored remote peer ID:', remotePeerIdRef.current, 'polite:', politeRef.current);
          
          // Create and send offer
          if (peerConnectionRef.current) {
            try {
              if (peerConnectionRef.current.signalingState !== 'stable') {
                console.log('Skip initial offer: signaling not stable');
                break;
              }
              console.log('Creating offer for:', message.userId);
              makingOfferRef.current = true;
              const offer = await peerConnectionRef.current.createOffer();
              await peerConnectionRef.current.setLocalDescription(offer);
              wsRef.current?.send(
                JSON.stringify({
                  type: 'offer',
                  offer,
                  targetId: message.userId,
                })
              );
              console.log('Sent offer to:', message.userId);
            } catch (err) {
              console.error('Initial offer error:', err);
            } finally {
              makingOfferRef.current = false;
            }
          }
        }
        break;

      case 'offer':
        console.log('Received offer from:', message.senderId);
        // Store the remote peer ID
        remotePeerIdRef.current = message.senderId;
        // Determine polite based on ids if not set yet
        if (politeRef.current === false && message.senderId) {
          politeRef.current = userId.localeCompare(message.senderId) > 0;
        }
        
        if (peerConnectionRef.current) {
          const pc = peerConnectionRef.current;
          const offerDesc = new RTCSessionDescription(message.offer);
          const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
          ignoreOfferRef.current = !politeRef.current && offerCollision;
          if (ignoreOfferRef.current) {
            console.warn('Offer collision detected (impolite). Ignoring offer.');
            break;
          }
          try {
            if (offerCollision) {
              try {
                // Rollback local description before applying remote offer
                await pc.setLocalDescription({ type: 'rollback' } as any);
              } catch (e) {
                console.warn('Rollback failed or unsupported:', e);
              }
            }
            await pc.setRemoteDescription(offerDesc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            wsRef.current?.send(
              JSON.stringify({
                type: 'answer',
                answer,
                targetId: message.senderId,
              })
            );
            console.log('Sent answer to:', message.senderId);
          } catch (err) {
            console.error('Error handling offer:', err);
          }
        }
        break;

      case 'answer':
        console.log('Received answer from:', message.senderId);
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(message.answer)
          );
        }
        break;

      case 'ice-candidate':
        console.log('Received ICE candidate from:', message.senderId);
        if (peerConnectionRef.current && message.candidate) {
          try {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(message.candidate)
            );
            console.log('Added ICE candidate');
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
        break;

      case 'user-disconnected':
        console.log('User disconnected:', message.userId);
        setRemoteConnected(false);
        remotePeerIdRef.current = null;
        toast({
          title: 'Participant Left',
          description: 'The other participant has left the call',
        });
        break;
    }
  };

  const monitorConnectionQuality = () => {
    const interval = setInterval(async () => {
      if (peerConnectionRef.current) {
        const stats = await peerConnectionRef.current.getStats();
        let quality: 'good' | 'fair' | 'poor' = 'good';

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            const packetsLost = report.packetsLost || 0;
            const packetsReceived = report.packetsReceived || 1;
            const lossRate = packetsLost / (packetsLost + packetsReceived);

            if (lossRate > 0.1) quality = 'poor';
            else if (lossRate > 0.05) quality = 'fair';
          }
        });

        setConnectionQuality(quality);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const handleEnableAudio = async () => {
    try {
      if (remoteVideoRef.current) {
        await remoteVideoRef.current.play();
        setNeedsAudioUnlock(false);
      }
    } catch (e) {
      console.warn('Audio unlock failed:', e);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;

        // Replace screen track with camera track
        if (localStreamRef.current && peerConnectionRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        // Restore local preview to camera
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace camera track with screen track
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    }
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();
    wsRef.current?.close();
  };

  const handleEndCall = () => {
    cleanup();
    onEndCall();
  };

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'good':
        return 'bg-green-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* Remote Video */}
        <Card className="relative overflow-hidden bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <Video className="h-16 w-16 mx-auto text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Waiting for participant...</p>
              </div>
            </div>
          )}
          <Badge className="absolute top-4 left-4" variant="secondary">
            Patient
          </Badge>
          {remoteConnected && needsAudioUnlock && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Button variant="secondary" onClick={handleEnableAudio} className="gap-2">
                Enable audio
              </Button>
            </div>
          )}
        </Card>

        {/* Local Video */}
        <Card className="relative overflow-hidden bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <VideoOff className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute top-4 left-4" variant="secondary">
            You ({userName})
          </Badge>
          <div className="absolute top-4 right-4 flex gap-2">
            <Badge className={getQualityColor()}>
              {connectionQuality.toUpperCase()}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="p-6 bg-card border-t">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={onOpenChat} className="gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button variant="outline" size="lg" onClick={onOpenNotes} className="gap-2">
              <FileText className="h-5 w-5" />
              <span className="hidden sm:inline">Notes</span>
            </Button>
            <Button variant="outline" size="lg" onClick={onOpenPrescription} className="gap-2">
              <Pill className="h-5 w-5" />
              <span className="hidden sm:inline">Prescription</span>
            </Button>
          </div>

          {/* Media Controls */}
          <div className="flex gap-2">
            <Button
              variant={isAudioEnabled ? 'default' : 'destructive'}
              size="lg"
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant={isVideoEnabled ? 'default' : 'destructive'}
              size="lg"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button
              variant={isScreenSharing ? 'secondary' : 'outline'}
              size="lg"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? (
                <MonitorOff className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
            </Button>
            <Button variant="destructive" size="lg" onClick={handleEndCall} className="gap-2">
              <Phone className="h-5 w-5 rotate-135" />
              End Call
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
