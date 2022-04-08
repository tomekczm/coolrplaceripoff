// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { PrismaClient } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'

type IsSucess = { sucess: boolean }

type Error = IsSucess & {
  error: string
}


export const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IsSucess | Error>
) {
    const code = req.body.code
    if(typeof code !== 'string') {
        res.status(400).json({
            sucess: false,
            error: 'code is required'
        })
        return
    }
    
    const response = await prisma.user.findFirst({
      where: {
        access_code: code
      }
    })
    if(!response) {
        res.status(400).json({
            sucess: false,
            error: 'code is invalid'
        })
        return
    }
  res.status(200).json({
    sucess: true,
  })
}
