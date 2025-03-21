const { createPaymentIntent } = require("../services/stripeService");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");

const createPayment = async (req, res) => {
    try {
        const { amount, currency, plan } = req.body;
        const userId = req.user.id;

        if (!amount || !currency || !plan || isNaN(Number(plan))) {
            return res.status(400).json({ error: "Datos inválidos para el pago" });
        }

        const planNumber = Number(plan);
        const paymentUrls = {
            1: "https://buy.stripe.com/test_9AQ6oY9Ao3xDcyA6oo",
            2: "https://buy.stripe.com/test_dR6aFe13S6JP8ik8wx",
            3: "https://buy.stripe.com/test_eVa14EbIwd8d424aEG"
        };

        if (!paymentUrls[planNumber]) {
            return res.status(400).json({ error: "Plan no válido" });
        }

        const paymentUrl = paymentUrls[planNumber];

        console.log("📌 Datos antes de crear PaymentIntent:", { userId, plan: planNumber });

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata: { userId: String(userId), plan: String(planNumber) } // Asegurar que se envían como string
        });

        console.log("🔍 PaymentIntent metadata enviado:", paymentIntent.metadata);

        await Payment.create({
            paymentIntentId: paymentIntent.id,
            userId,
            amount,
            currency,
            plan: planNumber,
            paymentUrl,
            status: "pending"
        });

        res.status(201).json({
            message: "Pago iniciado",
            paymentIntentId: paymentIntent.id,
            paymentUrl
        });
    } catch (error) {
        console.error("❌ Error al crear el pago:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
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

        // Buscar todos los pagos con paginación y popular userId sin password
        const payments = await Payment.paginate({}, {
            ...options,
            populate: {
                path: "userId",
                select: "-password -__v" // Excluir contraseña y versión del documento
            }
        });

        if (!payments || payments.docs.length === 0) {
            return res.status(404).json({ message: "No payments found" });
        }

        res.status(200).json({ payments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getPaymentStatus = async (req, res) => {
    try {
        const { paymentIntentId } = req.query;
        if (!paymentIntentId) {
            return res.status(400).json({ error: "Se requiere el paymentIntentId" });
        }

        const payment = await Payment.findOne({ paymentIntentId });
        if (!payment) {
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        res.json({ status: payment.status });
    } catch (error) {
        console.error("❌ Error al obtener el estado del pago:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const changePaymentStatus = async (req, res) => {
    try {
        const { paymentIntentId } = req.query;
        if (!paymentIntentId) {
            return res.status(400).json({ error: "paymentIntentId es requerido" });
        }

        const payment = await Payment.findOne({ paymentIntentId }); // 🔹 Buscar por paymentIntentId
        if (!payment) {
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        payment.status = "completed"; // O el estado correcto
        await payment.save();

        res.json({ message: "Estado de pago actualizado correctamente" });
    } catch (error) {
        console.error("❌ Error al actualizar el estado del pago:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPayment,
    myPayments,
    allPayments,
    getPaymentStatus,
    changePaymentStatus,
};
