import { Server, Socket } from 'socket.io';

export const setupMeetingSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    
    // Join a specific meeting room
    socket.on('join-room', (roomId: string, userId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', userId);

      // Handle disconnection from the room
      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId);
      });
    });

    // Relay WebRTC Offers
    socket.on('offer', (offer: any, roomId: string, toId: string) => {
      socket.to(roomId).emit('offer', offer, socket.id);
    });

    // Relay WebRTC Answers
    socket.on('answer', (answer: any, roomId: string, toId: string) => {
      socket.to(roomId).emit('answer', answer, socket.id);
    });

    // Relay ICE Candidates
    socket.on('ice-candidate', (candidate: any, roomId: string, toId: string) => {
      socket.to(roomId).emit('ice-candidate', candidate, socket.id);
    });

  });
};
