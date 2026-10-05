import { Request, Response } from 'express';
import { generateAIResponse } from '../services/aiService';
import { AuthRequest } from '../middleware/auth';

export const chatWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userId = req.user?.id;
    const aiResponse = await generateAIResponse(message, history, userId);

    return res.status(200).json({
      success: true,
      data: {
        response: aiResponse
      }
    });
  } catch (error) {
    console.error('Error in chatWithAI controller:', error);
    return res.status(500).json({ success: false, message: 'Failed to process AI request' });
  }
};
