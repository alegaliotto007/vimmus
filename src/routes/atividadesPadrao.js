const app = require('express')();
const mongoose = require("mongoose");
const passport = require('passport');

const jwt = require('jsonwebtoken');

require('../model/AtividadesPadrao');

const AtvPadrao = mongoose.model('atvPadrao');


app.post('/addAtvPadrao', (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    }
    const corpo = {
        user: id,
        descricao: req.body.descricao
    }
    new AtvPadrao(corpo).save().then(() => {
        req.flash('success_msg', 'Atividade padrão cadastrada.')
        res.redirect('/gerenciamento/atividadesPadrao')
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar as atividades padrão.')
        res.redirect('/gerenciamento/atividadesPadrao/')
    })
});

app.get('/', (req, res, next) => {
    AtvPadrao.find().lean().then((atv) => {
        res.render('principal/atividadesPadrao', { atv })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar as atividades padrão.')
        res.redirect('/gerenciamento/atividadesPadrao/')
    })
})

app.get('/delAtvPadrao/:id', (req, res) => {
    AtvPadrao.findOneAndDelete({ _id: req.params.id }).then(() => {
        req.flash('success_msg', 'Atividade padrão removida.')
        res.redirect('/gerenciamento/atividadesPadrao')
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar as atividades padrão.')
        res.redirect('/gerenciamento/atividadesPadrao')
    })
})

module.exports = app