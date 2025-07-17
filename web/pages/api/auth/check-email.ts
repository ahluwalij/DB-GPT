import { NextApiRequest, NextApiResponse } from 'next';
import { userRepository } from '../../../lib/db/repository';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const exists = await userRepository.existsByEmail(email);
    
    return res.status(200).json({ exists });
  } catch (error) {
    console.error('Email check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}