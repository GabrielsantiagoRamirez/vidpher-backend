const Agenda = require('../models/agenda');


// Controlador para crear un dato en la agenda
const save = async (req, res) => {
    try {
        // Obtener el id del usuario desde el token
        const userId = req.user.id;

        // Obtener los datos del cuerpo de la petición
        const { location, title, duration, time, date } = req.body;

        // Validar que todos los campos obligatorios estén presentes
        if (!location || !title || !duration || !time || !date) {
            return res.status(400).send({
                status: 'error',
                message: 'All fields are required.'
            });
        }

        // Validar que la duración sea un número
        const durationInHours = Number(duration);
        if (isNaN(durationInHours)) {
            return res.status(400).send({
                status: 'error',
                message: 'The duration must be a valid number of hours.'
            });
        }

        // Crear un nuevo registro en la agenda
        const newAgendaEntry = new Agenda({
            user: userId,
            location,
            title,
            duration: durationInHours,  // Guardar la duración como número
            time,
            date
        });

        // Guardar el registro en la base de datos
        await newAgendaEntry.save();

        // Enviar respuesta de éxito
        return res.status(201).send({
            status: 'success',
            message: 'Successfully created record in the agenda.',
            agenda: newAgendaEntry
        });

    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error al crear el registro en la agenda.',
            error: err.message
        });
    }
};

// Controlador para obtener todas las reuniones agendadas por fecha
const byDate = async (req, res) => {
    try {
        // Obtener el id del usuario desde el token
        const userId = req.user.id;

        // Consultar las reuniones agendadas del usuario y agruparlas por fecha
        const agendaByDate = await Agenda.aggregate([
            {
                $match: { user: userId } // Filtrar por el usuario
            },
            {
                $group: {
                    _id: "$date", // Agrupar por el campo "date"
                    meetings: {
                        $push: {
                            title: "$title",
                            location: "$location",
                            duration: "$duration",
                            time: "$time",
                            createdAt: "$createdAt" // Agregar campos necesarios
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 } // Ordenar por fecha ascendente
            }
        ]);

        // Validar si el usuario no tiene reuniones agendadas
        if (agendaByDate.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'No meetings found for the user.'
            });
        }

        // Respuesta de éxito con las reuniones agrupadas por fecha
        return res.status(200).send({
            status: 'success',
            message: 'Meetings retrieved successfully.',
            agenda: agendaByDate
        });

    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error while retrieving meetings.',
            error: err.message
        });
    }
};



module.exports = {
    save,
    byDate
};