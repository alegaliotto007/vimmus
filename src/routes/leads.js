const app = require('express')();

const mongoose = require('mongoose');

require('../model/Cliente');
require('../model/Pessoa');

const { ehAdmin } = require('../helpers/ehAdmin');

const Cliente = mongoose.model('cliente');
const Pessoa = mongoose.model('pessoa');

app.get('/leads', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { pessoa } = req.user
    const { vendedor } = req.user
    var id
    var idpes
    var sql = {}
    var clientes = []
    var q = 0

    if (naoVazio(user)) {
        id = user
        idpes = pessoa
        if (vendedor == true) {
            sql = { user: id, vendedor: idpes, lead: true }
        } else {
            sql = { user: id, lead: true }
        }
    } else {
        id = _id
        sql = { user: id, lead: true }
    }
    Cliente.find(sql).lean().then((cliente) => {
        if (naoVazio(cliente)) {
            cliente.forEach((e) => {
                Pessoa.findOne({ _id: e.vendedor }).then((vendedor) => {
                    clientes.push({ _id: e._id, nome: e.nome, cidade: e.cidade, uf: e.uf, contato: e.contato, celular: e.celular, vendedor: vendedor.nome })
                    q++
                    if (q == cliente.length) {
                        res.render('cliente/consulta', { clientes, tipo: 'lead' })
                    }
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível encontrar os vendedores.')
                    res.redirect('/dashboard')
                })
            })
        } else {
            res.render('cliente/consulta')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Nenhum cliente encontrado.')
        res.redirect('/cliente/consulta')
    })
});

module.exports = app;