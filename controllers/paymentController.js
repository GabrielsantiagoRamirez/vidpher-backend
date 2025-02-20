const { createPaymentIntent } = require("../services/stripeService");
const Payment = require("../models/payment");

const createPayment = async (req, res) => {
    try {
        const { amount, currency, paymentMethodId } = req.body;
        const userId = req.user.id; // Extraído desde el token (Asegúrate de tener middleware)

        // 1️⃣ Crear un PaymentIntent en Stripe
        const paymentIntent = await createPaymentIntent(amount, currency, paymentMethodId);

        if (!paymentIntent) {
            return res.status(400).json({ error: "Payment couldn't be created in Stripe" });
        }

        // 2️⃣ Guardar el pago en MongoDB
        const payment = new Payment({
            userId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status
        });

        await payment.save();

        res.status(201).json({ message: "Successful payment", payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const myPayments = async (req, res) => {
    try {
        const userId = req.user.id; // Extraído desde el token

        // Buscar todos los pagos del usuario logueado
        const payments = await Payment.find({ userId });

        if (!payments || payments.length === 0) {
            return res.status(404).json({ message: "No payments found for this user" });
        }

        res.status(200).json({ payments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const allPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; // Parámetros de paginación

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 } // Ordenar por fecha de creación (más reciente primero)
        };

        // Buscar todos los pagos con paginación
        const payments = await Payment.paginate({}, options);

        if (!payments || payments.docs.length === 0) {
            return res.status(404).json({ message: "No payments found" });
        }

        res.status(200).json({ payments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    createPayment,
    myPayments,
    allPayments
};
