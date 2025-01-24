const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const StorySchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    text: String,
    file: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: Array,
    suggested: {
        type: Boolean,
        default: false
    }
});

// Agrega el plugin de paginación
StorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Story", StorySchema);