// index.js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('connection.update', update => {
    const { connection, lastDisconnect, qr } = update
    if (qr) qrcode.generate(qr, { small: true })
    if (connection === 'close') {
      if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        console.log('🔄 Reconnecting...')
        startBot()
      } else {
        console.log('🔒 Logged out — delete auth and scan again.')
      }
    } else if (connection === 'open') {
      console.log('✅ Connected')
    }
  })

  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if (!msg.key.fromMe && msg.message?.conversation) {
      const text = msg.message.conversation
      const jid = msg.key.remoteJid

      // Auto-reply logic
      let reply = 'Got your message!'
      if (/available/i.test(text)) reply = "Yes, it's available!"
      else if (/price/i.test(text)) reply = "It's negotiable — make an offer!"

      await sock.sendMessage(jid, { text: reply })
      console.log(`[🤖] Replied to ${jid}: ${reply}`)
    }
  })

  process.on('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...')
    sock.logout()
  })
}

startBot()
