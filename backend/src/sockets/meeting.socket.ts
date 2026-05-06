import { Server, Socket } from 'socket.io';
import { redisClient } from '../config/redis';
import { Message } from '../models/Message';

export const setupMeetingSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    
    // Join a specific meeting room
    socket.on('join-room', async (roomId: string, userId: string) => {
      socket.join(roomId);
      
      // Store presence in Redis
      await redisClient.hSet('presence', userId, socket.id);
      
      socket.to(roomId).emit('user-connected', userId);

      // Handle disconnection from the room
      socket.on('disconnect', async () => {
        await redisClient.hDel('presence', userId);
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

    // Chat Message
    socket.on('send-message', async (roomId: string, senderId: string, text: string) => {
      try {
        // Save to database
        const newMessage = await Message.create({
          meetingId: roomId,
          senderId,
          text
        });
        
        // Broadcast to room including the sender (if needed) or let client handle sender msg
        // Usually, the sender might optimistically render, but we can broadcast to everyone
        io.to(roomId).emit('receive-message', newMessage);
      } catch (error) {
        console.error('Error saving message via socket:', error);
      }
    });

    // Raise Hand
    socket.on('raise-hand', (roomId: string, userId: string) => {
      socket.to(roomId).emit('user-raised-hand', userId);
    });

    // Lower Hand
    socket.on('lower-hand', (roomId: string, userId: string) => {
      socket.to(roomId).emit('user-lowered-hand', userId);
    });

  });
};
