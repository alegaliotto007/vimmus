const app = require('express')();
const mongoose = require('mongoose');

require('../model/Mensagem');

const { ehAdmin } = require('../helpers/ehAdmin');

const Mensagem = mongoose.model('mensagem');

app.get('/mensagem/', ehAdmin, (req, res) => {
    var id
    const { user } = req.user
    const { _id } = req.user

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    Mensagem.find({ user: id }).lean().then((mensagem) => {
        res.render('principal/mensagem', { mensagem })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar as mensagens')
        res.redirect('/dashboard')
    })
});

app.post('/mensagem', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var erro = ''

    if (req.body.descricao == '') {
        erro = 'É necessário incluir a descrição da mensagem. '
    }
    if (erro != '') {
        req.flash('error_msg', erro)
        res.redirect('/dashboard')
    } else {
        const msg = {
            user: id,
            descricao: req.body.descricao
        }

        new Mensagem(msg).save().then(() => {

            req.flash('success_msg', 'Mensagem adicionada com sucesso.')
            res.redirect('/gerenciamento/mensagem/')
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível salvar a mesagem.')
            res.redirect('/dashboard')
        })
    }
});

app.get('/deletamensagem/:id', ehAdmin, (req, res) => {

    Mensagem.findOneAndDelete({ _id: req.params.id }).then(() => {
        req.flash('success_msg', 'Mensagem removida com sucesso.')
        res.redirect('/gerenciamento/mensagem')
    }).catch((err) => {
        req.flash('error_msg', 'Houve erro ao excluir a mensagem.')
        res.redirect('/gerenciamento/mensagem')
    })
});

module.exports = app;