import { Server, Socket } from 'socket.io';
import { redisClient, isRedisConnected } from '../config/redis';
import { Message } from '../models/Message';

// Local fallbacks if Redis is down
const localNotes: { [roomId: string]: string } = {};
const localWhiteboard: { [roomId: string]: any[] } = {};

export const setupMeetingSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    
    // Join a specific meeting room
    socket.on('join-room', async (roomId: string, userId: string) => {
      socket.join(roomId);
      
      // Store presence
      if (isRedisConnected) {
        await redisClient.hSet(`room:${roomId}:presence`, userId, socket.id);
      }
      
      socket.to(roomId).emit('user-connected', userId);

      // Send current notes to the new user
      if (isRedisConnected) {
        const notes = await redisClient.get(`room:${roomId}:notes`);
        if (notes) socket.emit('initial-notes', notes);
      } else if (localNotes[roomId]) {
        socket.emit('initial-notes', localNotes[roomId]);
      }

      // Send whiteboard state
      if (isRedisConnected) {
        const boardData = await redisClient.lRange(`room:${roomId}:whiteboard`, 0, -1);
        if (boardData && boardData.length > 0) {
          boardData.forEach(item => socket.emit('draw-data', JSON.parse(item)));
        }
      } else if (localWhiteboard[roomId]) {
        localWhiteboard[roomId].forEach(item => socket.emit('draw-data', item));
      }

      // Handle disconnection from the room
      socket.on('disconnect', async () => {
        if (isRedisConnected) {
          await redisClient.hDel(`room:${roomId}:presence`, userId);
        }
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

    socket.on('transcription-chunk', (roomId: string, userId: string, text: string) => {
      socket.to(roomId).emit('transcription-chunk', userId, text);
    });

    socket.on('draw-data', async (roomId: string, data: any) => {
      socket.to(roomId).emit('draw-data', data);
      
      // Persist whiteboard stroke
      if (isRedisConnected) {
        await redisClient.rPush(`room:${roomId}:whiteboard`, JSON.stringify(data));
        await redisClient.expire(`room:${roomId}:whiteboard`, 86400); // 24h expiry
      } else {
        if (!localWhiteboard[roomId]) localWhiteboard[roomId] = [];
        localWhiteboard[roomId].push(data);
      }
    });

    socket.on('clear-whiteboard', async (roomId: string) => {
      socket.to(roomId).emit('clear-whiteboard');
      if (isRedisConnected) {
        await redisClient.del(`room:${roomId}:whiteboard`);
      } else {
        localWhiteboard[roomId] = [];
      }
    });

    socket.on('notes-update', async (roomId: string, delta: any) => {
      if (isRedisConnected) {
        await redisClient.set(`room:${roomId}:notes`, delta, { EX: 86400 });
      } else {
        localNotes[roomId] = delta;
      }
      socket.to(roomId).emit('notes-update', delta);
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
