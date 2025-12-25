import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import EmailProvider from "next-auth/providers/email"
import { prisma } from "./prisma"
import type SMTPTransport from "nodemailer/lib/smtp-transport"

// SMTP設定の検証
function getSMTPServer() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn("SMTP設定が不完全です。SMTP_HOST, SMTP_USER, SMTP_PASSWORDを設定してください。")
    return undefined
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user,
      pass,
    },
  }
}

const smtpServer = getSMTPServer()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    EmailProvider({
      server: smtpServer,
      from: process.env.SMTP_FROM || process.env.SENDGRID_FROM_EMAIL || "noreply@localhost",
      // メール送信エラー時の処理
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        if (!smtpServer) {
          throw new Error(
            "SMTP設定が不完全です。環境変数 SMTP_HOST, SMTP_USER, SMTP_PASSWORD を設定してください。"
          )
        }

        // provider.serverをそのままnodemailerに渡す
        const nodemailer = require("nodemailer")
        const server = provider.server as SMTPTransport.Options
        const transporter = nodemailer.createTransport(server)

        await transporter.sendMail({
          to: identifier,
          from: provider.from,
          subject: "メールくん - ログインリンク",
          text: `以下のリンクをクリックしてログインしてください:\n\n${url}\n\nこのリンクは24時間有効です。`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>メールくん - ログインリンク</h2>
              <p>以下のリンクをクリックしてログインしてください:</p>
              <p><a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">ログイン</a></p>
              <p style="color: #666; font-size: 12px;">このリンクは24時間有効です。</p>
              <p style="color: #666; font-size: 12px;">このメールに心当たりがない場合は、無視してください。</p>
            </div>
          `,
        })
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
}

