import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateMeetingSummary = async (transcript: string) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Returning mock summary.');
    return {
      summary: "This is a mock summary because the Gemini API key is missing. It seems like the team discussed the project roadmap and successfully integrated AI features.",
      actionItems: ["Set up GEMINI_API_KEY in .env", "Test AI summarization with real data", "Review Day 16 progress"]
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an expert meeting assistant. Below is a transcript from a video meeting.
      Please provide a concise summary of the discussion and extract a list of actionable items.
      
      Transcript:
      "${transcript}"
      
      Respond ONLY in the following JSON format:
      {
        "summary": "A brief 3-4 sentence paragraph summarizing the meeting.",
        "actionItems": ["Action item 1", "Action item 2", ...]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON response (sometimes AI adds markdown blocks)
    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate AI summary');
  }
};
export const analyzeMeetingMood = async (content: string) => {
  if (!process.env.GEMINI_API_KEY) {
    return {
      mood: "Neutral",
      sentimentScore: 50,
      insights: ["AI analysis is disabled (missing API key)."]
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Analyze the following chat/transcript from a professional meeting.
      Determine the overall mood (e.g., Productive, Tense, Enthusiastic, Calm) and a sentiment score from 0 to 100 (100 being extremely positive).
      Also, provide 2-3 brief insights or suggestions for the host to improve the meeting engagement.
      
      Content:
      "${content}"
      
      Respond ONLY in the following JSON format:
      {
        "mood": "Mood Name",
        "sentimentScore": 75,
        "insights": ["Insight 1", "Insight 2"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error in analyzeMeetingMood:', error);
    return { mood: "Unknown", sentimentScore: 50, insights: ["Error performing analysis."] };
  }
};
