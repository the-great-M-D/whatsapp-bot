import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import QRCode from 'qrcode-terminal'

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('connection.update', update => {
    const { connection, lastDisconnect, qr } = update
    if (qr) QRCode.generate(qr, { small: true })
    if (connection === 'close' && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
      connect()
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!')
    }
  })

  sock.ev.on('messages.upsert', m => {
    const msg = m.messages[0]
    if (!msg.key.fromMe && msg.message?.conversation) {
      const from = msg.key.remoteJid
      const text = msg.message.conversation
      sock.sendMessage(from, { text: 'Got your message: ' + text })
    }
  })
}

connect()
