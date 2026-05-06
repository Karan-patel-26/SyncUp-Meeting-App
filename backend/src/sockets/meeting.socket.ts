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
        const newMessage = await Message.create({
          meetingId: roomId,
          senderId,
          text
        });
        
        // Use 'new-message' to align with frontend
        io.to(roomId).emit('new-message', newMessage);
      } catch (error) {
        console.error('Error saving message via socket:', error);
      }
    });

    // Raise Hand
    socket.on('raise-hand', (roomId: string, userId: string) => {
      // Use 'hand-raised' to align with frontend
      socket.to(roomId).emit('hand-raised', userId);
    });

    // Lower Hand
    socket.on('lower-hand', (roomId: string, userId: string) => {
      // Use 'hand-lowered' to align with frontend
      socket.to(roomId).emit('hand-lowered', userId);
    });

    // Admin Actions: Mute User
    socket.on('mute-user', (roomId: string, targetUserId: string) => {
      // Broadcast to the room so everyone knows they are muted, 
      // and specific listener on target user will trigger their hardware mute
      io.to(roomId).emit('mute-remote-user', targetUserId);
    });

    // Admin Actions: Kick User
    socket.on('kick-user', (roomId: string, targetUserId: string) => {
      io.to(roomId).emit('kick-remote-user', targetUserId);
    });

  });
};
