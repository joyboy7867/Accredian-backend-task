import express from 'express';
import { PrismaClient } from '@prisma/client';
import bodyParser from 'body-parser';
import cors from "cors"
import { google } from 'googleapis';
import nodemailer from 'nodemailer'


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI
const REFRESH_TOKEN = process.env.REFRESH_TOKEN

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
// create a const and auth user from it
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
// then set credential we got from playground
// then using nodemailer creater a transport variable and init transport with its para and auth para
// then create mailto object and pass to transport 
const db = new PrismaClient()

const app = express();
app.use(bodyParser.urlencoded({extended:true}))
app.use(cors())
app.listen(5000, () => {
    console.log('backend running at http://localhost:5000');
});

app.post('/api/first', async (req, res) => {
    try {
        const{Referrername,Referreremail,Referrerphone,Referrerrelation,Referrercomment,name,floating_email,phone}=await req.body
        try {
            const newreferrer = await db.referrer.create({
                data: {
                    name: Referrername,
                    email: Referreremail,
                    phoneNumber: Referrerphone,
                    relationshipToReferee: Referrerrelation,
                    additionalComments:Referrercomment,
    
                },
            });
           
            const newreferre=await db.referee.create({
                data:{
                    name:name,
                    email:floating_email,
                    phoneNumber:phone,
                    messageFromReferrer:Referrercomment,
                    referrerId:newreferrer.id
    
                }
            })
            console.log("successfully saved into database")
            try {
                const accessToken = await oAuth2Client.getAccessToken();
            
                const transport = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    type: 'OAuth2',
                    user: 'amaan.kp7867@gmail.com',
                    clientId: CLIENT_ID,
                    clientSecret: CLIENT_SECRET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: accessToken.token,
                  },
                });
            
                const mailOptions = {
                  from: 'amaan.kp7867@gmail.com',
                  to: floating_email,
                  subject: "Accredian Refer Invite",
                  text: Referrercomment,
                };
            
                const result = await transport.sendMail(mailOptions);
                
              } catch (error) {
                console.error('Error sending email:', error);
              }

      
            res.json({ status:true })
            
        } catch (error) {
            console.log("Missing field Or already referred")
            res.json({ status:false })
        }
       
        
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'An error occurred while creating the user.',status:false });
    }
});
