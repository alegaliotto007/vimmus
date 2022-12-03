const express = require('express');
const router = express.Router();

require('../model/Projeto');
require('../model/Equipe');
require('../model/Empresa');
require('../model/Cliente');
require('../model/Tarefas');
require('../model/Servico');
require('../model/Acesso');
require('../model/Pedido');
require('../model/Usina');
require('../model/Pessoa');
require('../model/Agenda');
require('../model/AtividadesPadrao');
require('../model/Parametros');
require('../model/Componente');
require('dotenv').config();

const { ehAdmin } = require('../helpers/ehAdmin');

const mongoose = require('mongoose');
const aws = require("aws-sdk");
const multer = require('multer');
const multerS3 = require("multer-s3");
var excel = require('exceljs');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const Acesso = mongoose.model('acesso');
const Empresa = mongoose.model('empresa');
const Cliente = mongoose.model('cliente');
const Usina = mongoose.model('usina');
const Pessoa = mongoose.model('pessoa');
const Tarefas = mongoose.model('tarefas');
const Equipe = mongoose.model('equipe');
const Projeto = mongoose.model('projeto');
const Pedido = mongoose.model('pedido');
const Agenda = mongoose.model('agenda');
const AtvPadrao = mongoose.model('atvPadrao');
const Parametros = mongoose.model('parametros');
const Componente = mongoose.model('componente');

const dataBusca = require('../resources/dataBusca');
const setData = require('../resources/setData');
const dataMensagem = require('../resources/dataMensagem');
const dataHoje = require('../resources/dataHoje');
const naoVazio = require('../resources/naoVazio');
const mascaraDecimal = require('../resources/mascaraDecimal');
const dataInput = require('../resources/dataInput');
const buscaPrimeira = require('../resources/buscaPrimeira');

var credentials = new aws.SharedIniFileCredentials({ profile: 'vimmusimg' })
aws.config.credentials = credentials

var s3 = new aws.S3()
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'quasatimg',
        //new Date().getSeconds() + '_' + new Date().getFullYear() + '_' + new Date().getMonth() + '_' + new Date().getDate
        key: function (req, file, cb) {
            cb(null, req.body.seq + '_' + file.originalname)
        }
    })
});


router.get('/orcamento', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { vendedor } = req.user
    const { funges } = req.user
    const { orcamentista } = req.user

    var id
    var valor
    var campo = ''
    var options = ''
    var selectini = ''
    var selectfim = ''
    var lista_itens = []
    var lista_params = []
    var x = 0

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    var quebra = false
    Componente.find({ user: id, classificacao: 'solar' }).lean().then((equipamento) => {
        Parametros.find({ user: id, tipo: 'solar' }).then((parametros) => {
            //console.log('tems params')
            parametros.forEach((e) => {
                //console.log('valor=>' + e.valor)
                if (naoVazio(e.valor)) {
                    valor = e.valor.split(';')
                    //console.log('valor=>' + valor)
                    if (valor.length > 1) {
                        selectini = '<select name="params[]" class="form-select form-select-sm mb-1">'
                        selectfim = '</select>'
                        for (let i = 0; i < valor.length; i++) {
                            //console.log('i=>'+i)
                            //console.log('valor=>'+valor[i])
                            options = options + '<option value="' + valor[i] + '">' + valor[i] + '</option>'
                        }
                        //console.log('dados=>' + dados[x].descricao)
                        //console.log('valor=>' + e.descricao)
                        if (dados[x].descricao == e.descricao) {
                            options = '<option class="fw-bold" value="' + dados[x].valor + '">' + dados[x].valor + '</option>' + options
                        }
                        campo = selectini + options + selectfim
                    } else {
                        //console.log('input type text')
                        campo = '<input type="text" class="form-control form-control-sm mb-1" name="params[]" value="">'
                    }
                } else {
                    //console.log('input type text vazio')
                    campo = '<input type="text" class="form-control form-control-sm mb-1" name="params[]" value="">'
                }
                lista_itens.push({ desc: e.descricao })
                //console.log('campo=>' + campo)
                //console.log('descricao=>' + e.descricao)
                lista_params.push({ id: e._id, descricao: e.descricao, campo })
                campo = ''
                options = ''
                x++
            })
            if (naoVazio(user)) {
                if (vendedor == true) {
                    Acesso.findOne({ _id: _id }).then((acesso) => {
                        //console.log('acesso.pessoa=>' + acesso.pessoa)
                        Pessoa.findOne({ user: id, _id: acesso.pessoa }).then((ven) => {
                            //console.log('ven._id=>' + ven._id)
                            res.render('principal/orcamento', { vendedor, idven: ven._id, equipamento, lista_params, lista_itens })
                        }).catch((err) => {
                            req.flash('error_msg', 'Não foi possível encontrar o responsável.')
                            res.redirect('/dashboard')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Não foi possível encontrar o acesso.')
                        res.redirect('/dashboard')
                    })
                } else {
                    if (orcamentista == true || funges == true) {
                        quebra = true
                    }
                    Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
                        res.render('principal/orcamento', { todos_vendedores, quebra, equipamento, lista_params, lista_itens })
                    }).catch((err) => {
                        req.flash('error_msg', 'Não foi possível encontrar o responsável.')
                        res.redirect('/dashboard')
                    })
                }
            } else {
                Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
                    res.render('principal/orcamento', { todos_vendedores, quebra: true, equipamento, lista_params, lista_itens })
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível encontrar o responsável.')
                    res.redirect('/dashboard')
                })
            }
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar os parâmetros.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar os equipamentos.')
        res.redirect('/dashboard')
    })
})

router.post('/orcamento', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { vendedor } = req.user
    const { funges } = req.user
    const { orcamentista } = req.user

    var id
    //var tipo = req.body.seltipo
    //console.log('tipo=>' + tipo)

    var lista_params = []
    var lista_itens = []
    var valor = []
    var selectini
    var selectfim
    var options = ''
    var campo


    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    AtvPadrao.find({ user: id }).then((atvpadrao) => {
        if (naoVazio(atvpadrao)) {
            var quebra = false
            //console.log('req.body.tipo =>' + req.body.seltipo )
            Componente.find({ user: id, classificacao: 'solar' }).lean().then((equipamento) => {
                Parametros.find({ user: id, tipo: 'solar' }).then((parametros) => {
                    parametros.forEach((e) => {
                        //console.log('e.valor=>'+e.valor)
                        if (naoVazio(e.valor)) {
                            valor = e.valor.split(';')
                            //console.log('valor.length=>'+valor.length)
                            if (valor.length > 1) {
                                selectini = '<select name="params[]" class="form-select form-select-sm mb-1">'
                                selectfim = '</select>'
                                for (let i = 0; i < valor.length; i++) {
                                    //console.log('i=>'+i)
                                    //console.log('valor=>'+valor[i])
                                    options = options + '<option value="' + valor[i] + '">' + valor[i] + '</option>'
                                }
                                campo = selectini + options + selectfim
                            } else {
                                campo = '<input type="text" class="form-control form-control-sm mb-1" name="params[]" value="' + e.valor + '">'
                            }
                        } else {
                            campo = '<input type="text" class="form-control form-control-sm mb-1" name="params[]" value="">'
                        }
                        lista_itens.push({ desc: e.descricao })
                        //console.log('campo=>'+campo)
                        //console.log('descricao=>'+e.descricao)
                        lista_params.push({ id: e._id, descricao: e.descricao, campo })
                        campo = ''
                        options = ''
                    })
                    //console.log('req.body.cliente=>' + req.body.cliente)
                    if (naoVazio(req.body.cliente)) {
                        Cliente.findOne({ _id: req.body.cliente }).lean().then((cliente) => {
                            if (naoVazio(user)) {
                                if (vendedor == true) {
                                    Acesso.findOne({ _id: _id }).then((acesso) => {
                                        //console.log('acesso.pessoa=>' + acesso.pessoa)
                                        Pessoa.findOne({ user: id, _id: acesso.pessoa }).then((ven) => {
                                            //console.log('ven._id=>' + ven._id)
                                            res.render('principal/orcamento', { vendedor: vendedor, equipamento, idven: ven._id, cliente, lista_params, lista_itens })
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Não foi possível encontrar o responsável.')
                                            res.redirect('/dashboard')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Não foi possível encontrar o acesso.')
                                        res.redirect('/dashboard')
                                    })
                                } else {
                                    if (orcamentista == true || funges == true) {
                                        quebra = true
                                    }
                                    Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
                                        res.render('principal/orcamento', { todos_vendedores, equipamento, quebra, cliente, lista_params, lista_itens })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Não foi possível encontrar o responsável.')
                                        res.redirect('/dashboard')
                                    })
                                }
                            } else {
                                Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
                                    res.render('principal/orcamento', { todos_vendedores, equipamento, quebra: true, cliente, lista_params, lista_itens })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Não foi possível encontrar o responsável.')
                                    res.redirect('/dashboard')
                                })
                            }
                        }).catch((err) => {
                            req.flash('error_msg', 'Não foi possível encontrar o cliente.')
                            res.redirect('/dashboard')
                        })
                    } else {
                        if (naoVazio(user)) {
                            //console.log('entrou')
                            //console.log('vendedor=>'+vendedor)
                            if (vendedor == true) {
                                Acesso.findOne({ _id: _id }).then((acesso) => {
                                    //console.log('acesso.pessoa=>' + acesso.pessoa)
                                    Pessoa.findOne({ user: id, _id: acesso.pessoa }).then((ven) => {
                                        //console.log('ven._id=>' + ven._id)
                                        res.render('principal/orcamento', { vendedor, equipamento, idven: ven._id, lista_params, lista_itens })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Não foi possível encontrar o responsável.')
                                        res.redirect('/dashboard')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Não foi possível encontrar o acesso.')
                                    res.redirect('/dashboard')
                                })
                            } else {
                                if (orcamentista == true || funges == true) {
                                    quebra = true
                                }
                                Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
                                    res.render('principal/orcamento', { todos_vendedores, equipamento, quebra, lista_params, lista_itens })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Não foi possível encontrar o responsável.')
                                    res.redirect('/dashboard')
                                })
                            }
                        } else {
                            //console.log('lista_params=>'+lista_params)
                            Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
                                res.render('principal/orcamento', { todos_vendedores, equipamento, quebra: true, tipo, lista_params, lista_itens })
                            }).catch((err) => {
                                req.flash('error_msg', 'Não foi possível encontrar os parâmetros.')
                                res.redirect('/dashboard')
                            })

                        }
                    }
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível encontrar os parâmetros.')
                    res.redirect('/dashboard')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Não foi possível encontrar os componentes<orcven>.')
                res.redirect('/dashboard')
            })
        } else {
            req.flash('error_msg', 'Não foi possível encontrar as atividades padrão. Realize o cadastro das atividades para iniciar uma obra ou serviço.')
            res.redirect('/gerenciamento/atividadesPadrao')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar as atividades padrão.')
        res.redirect('/cliente/novo')
    })
})

router.post('/addorcamento/', ehAdmin, async (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { pessoa } = req.user
    const { vendedor } = req.user

    var q = 0
    var texto

    var id
    var sql_aux = {}
    var sql = {}
    var params = []
    var material = []
    var dados
    var dados_desc
    var dados_qtd
    var cpf
    var cnpj
    var novo = false
    var amplia = false
    var tipo = req.body.tipo

    if (tipo == 'novo') {
        novo = true
    }
    if (tipo == 'ampliacao') {
        amplia = true
    }
    if (naoVazio(user)) {
        id = user
    } else {
        id = _id
    }

    var erros = []
    var idprojeto = []
    var corpo = []
    var corpoVen = []
    var projeto = []
    var cliente = []
    var temvendedor = []
    idprojeto = req.body.id
    idprojeto = String(idprojeto).split(',')

    if (naoVazio(idprojeto[0])) {
        Projeto.findOne({ _id: idprojeto[0] }).then((projeto) => {
            // potencia = Math.trunc(parseFloat(req.body.plaQtdMod) * parseFloat(req.body.plaWattMod), 1) / 1000
            // projeto.potencia = potencia
            projeto.endereco = buscaPrimeira(req.body.endereco)
            projeto.numero = req.body.numero
            projeto.bairro = req.body.bairro
            projeto.cep = req.body.cep
            projeto.complemento = req.body.complemento
            if (vendedor == false) {
                projeto.vendedor = req.body.vendedor
                projeto.vlrServico = req.body.vlrServico
                projeto.vlrKit = req.body.vlrKit
                projeto.valor = req.body.vlrTotal
                projeto.plaQtdMod = req.body.plaQtdMod
                projeto.plaWattMod = req.body.plaWattMod
                projeto.plaQtdInv = req.body.plaQtdInv
                projeto.plaKwpInv = req.body.plaKwpInv
                projeto.plaDimArea = req.body.plaDimArea
                projeto.plaQtdString = req.body.plaQtdString
            }
            projeto.cidade = req.body.cidade
            projeto.uf = req.body.estado
            projeto.datacad = dataBusca(dataHoje())

            projeto.telhado = req.body.telhado
            projeto.estrutura = req.body.estrutura
            projeto.concessionaria = req.body.concessionaria
            projeto.orientacao = req.body.orientacao
            if (vendedor == false) {
                projeto.valor = req.body.valor
            }

            projeto.descuc = req.body.descuc
            projeto.descug = req.body.descug
            // projeto.obsgeral = req.body.obsgeral
            projeto.pagamento = req.body.pagamento
            projeto.pagador = req.body.pagador
            projeto.prazo = req.body.dataprazo

            dados = req.body.campos
            dados_desc = req.body.dados_desc
            dados_qtd = req.body.dados_qtd

            projeto.save().then(() => {
                Parametros.find({ user: id, tipo: 'solar' }).then((lista_params) => {
                    dados = dados.split(';')
                    for (let i = 0; i < lista_params.length; i++) {
                        params.push({ descricao: lista_params[i].descricao, tipo: lista_params[i].opcao, valor: dados[i] })
                    }

                    dados_desc = dados_desc.split(';')
                    dados_qtd = dados_qtd.split(';')
                    // if (dados_desc.length > 1) {
                    for (let i = 0; i < dados_desc.length; i++) {
                        material.push({ desc: dados_desc[i], qtd: dados_qtd[i] })
                    }
                    // } else {
                    //     material.push({ desc: req.body.dados_desc, qdt: req.body.dados_qtd })
                    // 
                    Projeto.findOneAndUpdate({ _id: projeto._id }, { $set: { params: params } }).then(() => {
                        Projeto.findOneAndUpdate({ _id: projeto._id }, { $push: { material: material } }).then(() => {
                            req.flash('success_msg', 'Proposta salva com sucesso.')
                            res.redirect('/gerenciamento/orcamento/' + idprojeto[0])
                        })
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível encontrar os parâmetros.')
                    res.redirect('/cliente/novo')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar a projeto.')
                res.redirect('/gerenciamento/orcamento/' + idprojeto[0])
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao salvar a projeto.')
            res.redirect('/gerenciamento/orcamento/' + idprojeto[0])
        })
    } else {
        var seq
        var numprj

        var nome = buscaPrimeira(req.body.nome)
        // var sobrenome = req.body.sobrenome
        var endereco = buscaPrimeira(req.body.endereco)
        var numero = req.body.numero
        var bairro = buscaPrimeira(req.body.bairro)
        var complemento = buscaPrimeira(req.body.complemento)
        var uf = req.body.estados
        var cep = req.body.cep
        var cidade = buscaPrimeira(req.body.cidade)
        if (naoVazio(req.body.cpf)) {
            cpf = req.body.cpf
        } else {
            cpf = 0
        }
        if (naoVazio(req.body.cnpj)) {
            cnpj = req.body.cnpj
        } else {
            cnpj = 0
        }
        var contato = buscaPrimeira(req.body.contato)
        var celular = req.body.celular
        var email = req.body.email
        var documento = false

        if (naoVazio(cpf) && cpf != 0) {
            documento = true
            sql = { user: id, cpf: cpf }
        } else {
            if (naoVazio(cnpj) && cnpj != 0) {
                documento = true
                sql = { user: id, cnpj: cnpj }
            } else {
                sql = { user: id }
            }
        }
        let sameCliente = false
        if (naoVazio(nome) && naoVazio(celular)) {
            try {
                const achou_cliente = await Cliente.findOne(sql)
                if (achou_cliente != null) {
                    //console.log(achou_cliente.vendedor)
                    //console.log(pessoa)
                    if (JSON.stringify(achou_cliente.vendedor) == JSON.stringify(pessoa)) {
                        sameCliente = true
                    }
                }
                //console.log(sameCliente)
                if (sameCliente || achou_cliente == null) {
                    //console.log('entrou')
                    try {
                        const p = await Pessoa.findOne({ _id: pessoa })
                        const empresa = await Empresa.findOne({ user: id })
                        if (naoVazio(empresa.seq)) {
                            seq = parseFloat(empresa.seq) + 1
                            if (naoVazio(empresa.const)) {
                                numprj = empresa.const + (parseFloat(empresa.seq) + 1)
                            } else {
                                numprj = (parseFloat(empresa.seq) + 1)
                            }
                            empresa.seq = seq
                        } else {
                            if (naoVazio(empresa.const)) {
                                numprj = empresa.const + String(1)
                            } else {
                                numprj = 1
                            }
                            empresa.seq = 1
                        }
                        dados = req.body.campos
                        dados_desc = req.body.dados_desc
                        dados_qtd = req.body.dados_qtd
                        Parametros.find({ user: id, tipo: 'solar' }).then((lista_params) => {
                            dados = dados.split(';')
                            for (let i = 0; i < lista_params.length; i++) {
                                params.push({ descricao: lista_params[i].descricao, tipo: lista_params[i].opcao, valor: dados[i] })
                            }
                            dados_desc = dados_desc.split(';')
                            dados_qtd = dados_qtd.split(';')
                            for (let i = 0; i < dados_desc.length; i++) {
                                material.push({ desc: dados_desc[i], qtd: dados_qtd[i] })
                            }
                            if (naoVazio(achou_cliente) && achou_cliente.lead == false) {
                                if (achou_cliente.cnpj == cnpj || achou_cliente.cpf == cpf) {
                                    req.flash('aviso_msg', 'Foi gerado mais um orçamento para o cliente: ' + achou_cliente.nome)
                                }
                                if (tipo == 'novo') {
                                    novo = true
                                } else {
                                    novo = false
                                }
                                if (tipo == 'ampliacao') {
                                    amplia = true
                                } else {
                                    amplia = false
                                }
                                projeto = {
                                    user: id,
                                    cliente: achou_cliente._id,
                                    vendedor: pessoa,
                                    datacad: dataBusca(dataHoje()),
                                    endereco: endereco,
                                    numero: numero,
                                    bairro: bairro,
                                    cep: cep,
                                    complemento: complemento,
                                    cidade: cidade,
                                    uf: uf,
                                    ganho: false,
                                    encerrado: false,
                                    baixada: false,
                                    execucao: false,
                                    parado: false,
                                    entregue: false,
                                    instalado: false,
                                    autorizado: false,
                                    pago: false,
                                    checkpedido: false,
                                    seq: numprj,
                                    status: 'Enviado',
                                    params: params,
                                    material: material,
                                    novo: novo,
                                    ampliacao: amplia,
                                    telhado: req.body.telhado,
                                    orientacao: req.body.orientacao,
                                    estrutura: req.body.estrutura,
                                    concessionaria: req.body.concessionaria
                                }
                                if (vendedor == false) {
                                    corpoVen = {
                                        plaQtdMod: req.body.plaQtdMod,
                                        plaWattMod: req.body.plaWattMod,
                                        plaQtdInv: req.body.plaQtdInv,
                                        plaKwpInv: req.body.plaKwpInv,
                                        plaDimArea: req.body.plaDimArea,
                                        plaQtdString: req.body.plaQtdString,
                                        plaModString: req.body.plaModString,
                                        plaQtdEst: req.body.plaQtdEst,
                                        valor: req.body.valor,
                                    }
                                    corpo = Object.assign(corpo, projeto, corpoVen)
                                } else {
                                    corpo = projeto
                                }
                                //console.log('corpo=>'+JSON.stringify(corpo))
                                new Projeto(corpo).save().then(() => {
                                    Projeto.findOne({ user: id }).sort({ field: 'asc', _id: -1 }).then((novo_projeto) => {
                                        empresa.save().then(() => {
                                            q = 0
                                            var texto
                                            Acesso.find({ user: id, notorc: 'checked' }).then((acesso) => {
                                                //console.log('acesso=>' + acesso)
                                                if (naoVazio(acesso)) {
                                                    acesso.forEach((e) => {
                                                        Pessoa.findOne({ _id: e.pessoa }).then((pessoa) => {
                                                            //console.log('pessoa=>' + pessoa)
                                                            texto = 'Olá ' + pessoa.nome + ',' + '\n' +
                                                                'O orçamento ' + novo_projeto.seq + ' para o cliente ' + achou_cliente.nome + ' foi criado dia ' + dataMensagem(dataHoje()) + ' por: ' + p.nome + '.' + '\n' +
                                                                'Acesse https://vimmus.com.br/gerenciamento/orcamento/' + novo_projeto._id + ' e acompanhe'
                                                            //console.log('pessoa.celular=>'+pessoa.celular)
                                                            client.messages
                                                                .create({
                                                                    body: texto,
                                                                    from: 'whatsapp:+554991832978',
                                                                    to: 'whatsapp:+55' + pessoa.celular
                                                                })
                                                                .then((message) => {
                                                                    q++
                                                                    //console.log('q=>' + q)
                                                                    //console.log('acesso.length=>' + acesso.length)
                                                                    if (q == acesso.length) {
                                                                        //console.log(message.sid)
                                                                        req.flash('success_msg', 'Proposta adicionada com sucesso')
                                                                        res.redirect('/gerenciamento/orcamento/' + novo_projeto._id)
                                                                    }
                                                                }).done()

                                                        }).catch((err) => {
                                                            req.flash('error_msg', 'Houve um erro ao encontrar a pessoa<whats>.')
                                                            res.redirect('/dashboard')
                                                        })
                                                    })
                                                } else {
                                                    req.flash('success_msg', 'Proposta adicionada com sucesso')
                                                    res.redirect('/gerenciamento/orcamento/' + novo_projeto._id)
                                                }
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Houve um erro ao encontrar o acesso.')
                                                res.redirect('/dashboard')
                                            })
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Houve um erro ao salvar a pessoa.')
                                            res.redirect('/dashboard')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Houve um erro ao encontrar o projeto.')
                                        res.redirect('/dashboard')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Houve um erro ao salvar a projeto.')
                                    res.redirect('/dashboard')
                                })

                            } else {
                                if (naoVazio(achou_cliente) && achou_cliente.lead == true) {
                                    achou_cliente.nome = buscaPrimeira(req.body.nome)
                                    achou_cliente.endereco = buscaPrimeira(req.body.endereco)
                                    achou_cliente.numero = req.body.numero
                                    achou_cliente.bairro = req.body.bairro
                                    achou_cliente.cep = req.body.cep
                                    achou_cliente.complemento = req.body.complemento
                                    achou_cliente.cidade = req.body.cidade
                                    achou_cliente.uf = req.body.uf
                                    achou_cliente.contato = buscaPrimeira(req.body.contato)
                                    achou_cliente.celular = req.body.celular
                                    achou_cliente.email = req.body.email
                                    achou_cliente.lead = false
                                    if (achou_cliente.novo == 'checked') {
                                        novo = true
                                    }
                                    if (achou_cliente.ampliacao == 'checked') {
                                        amplia = true
                                    }
                                    achou_cliente.save().then(() => {
                                        if (tipo == 'novo') {
                                            novo = true
                                        } else {
                                            novo = false
                                        }
                                        if (tipo == 'ampliacao') {
                                            amplia = true
                                        } else {
                                            amplia = false
                                        }
                                        projeto = {
                                            user: id,
                                            cliente: achou_cliente._id,
                                            vendedor: req.body.vendedor,
                                            datacad: dataBusca(dataHoje()),
                                            endereco: endereco,
                                            numero: numero,
                                            bairro: bairro,
                                            cep: cep,
                                            complemento: complemento,
                                            cidade: cidade,
                                            uf: uf,
                                            ganho: false,
                                            encerrado: false,
                                            baixada: false,
                                            execucao: false,
                                            parado: false,
                                            entregue: false,
                                            instalado: false,
                                            autorizado: false,
                                            pago: false,
                                            checkpedido: false,
                                            seq: numprj,
                                            status: 'Enviado',
                                            params: params,
                                            material: material,
                                            descuc: req.body.descuc,
                                            descug: req.body.descug,
                                            novo: novo,
                                            ampliacao: amplia
                                        }
                                        if (vendedor == false) {
                                            corpoVen = {
                                                plaQtdMod: req.body.plaQtdMod,
                                                plaWattMod: req.body.plaWattMod,
                                                plaQtdInv: req.body.plaQtdInv,
                                                plaKwpInv: req.body.plaKwpInv,
                                                plaDimArea: req.body.plaDimArea,
                                                plaQtdString: req.body.plaQtdString,
                                                plaModString: req.body.plaModString,
                                                plaQtdEst: req.body.plaQtdEst,
                                                valor: req.body.valor,
                                                telhado: req.body.telhado,
                                                orientacao: req.body.orientacao,
                                                valor: req.body.valor,
                                                estrutura: req.body.estrutura,
                                                concessionaria: req.body.concessionaria
                                            }
                                            corpo = Object.assign(corpo, projeto, corpoVen)
                                        } else {
                                            corpo = projeto
                                        }
                                        //console.log('corpo=>'+JSON.stringify(corpo))
                                        new Projeto(corpo).save().then(() => {
                                            Projeto.findOne({ user: id }).sort({ field: 'asc', _id: -1 }).then((novo_projeto) => {
                                                Cliente.findOne({ _id: novo_projeto.cliente }).then((cliente) => {
                                                    empresa.save().then(() => {
                                                        q = 0
                                                        Acesso.find({ user: id, notorc: 'checked' }).then((acesso) => {
                                                            //console.log('acesso=>' + acesso)
                                                            if (naoVazio(acesso)) {
                                                                acesso.forEach((e) => {
                                                                    Pessoa.findOne({ _id: e.pessoa }).then((pessoa) => {
                                                                        //console.log('pessoa=>' + pessoa)
                                                                        texto = 'Olá ' + pessoa.nome + ',' + '\n' +
                                                                            'O orçamento ' + novo_projeto.seq + ' para o cliente ' + cliente.nome + ' foi criado dia ' + dataMensagem(dataHoje()) + ' por: ' + p.nome + '.' + '\n' +
                                                                            'Acesse https://vimmus.com.br/gerenciamento/orcamento/' + novo_projeto._id + ' e acompanhe'
                                                                        //console.log('pessoa.celular=>'+pessoa.celular)
                                                                        client.messages
                                                                            .create({
                                                                                body: texto,
                                                                                from: 'whatsapp:+554991832978',
                                                                                to: 'whatsapp:+55' + pessoa.celular
                                                                            })
                                                                            .then((message) => {
                                                                                q++
                                                                                //console.log('q=>' + q)
                                                                                //console.log('acesso.length=>' + acesso.length)
                                                                                if (q == acesso.length) {
                                                                                    //console.log(message.sid)
                                                                                    req.flash('success_msg', 'Proposta adicionada com sucesso')
                                                                                    res.redirect('/gerenciamento/orcamento/' + novo_projeto._id)
                                                                                }
                                                                            }).done()

                                                                    }).catch((err) => {
                                                                        req.flash('error_msg', 'Houve um erro ao encontrar a pessoa<whats>.')
                                                                        res.redirect('/dashboard')
                                                                    })
                                                                })
                                                            } else {
                                                                req.flash('success_msg', 'Proposta adicionada com sucesso')
                                                                res.redirect('/gerenciamento/orcamento/' + novo_projeto._id)
                                                            }
                                                        }).catch((err) => {
                                                            req.flash('error_msg', 'Houve um erro ao encontrar o acesso.')
                                                            res.redirect('/dashboard')
                                                        })
                                                    }).catch((err) => {
                                                        req.flash('error_msg', 'Houve um erro ao salvar a pessoa.')
                                                        res.redirect('/dashboard')
                                                    })

                                                }).catch((err) => {
                                                    req.flash('error_msg', 'Houve um erro ao encontrar o cliente.')
                                                    res.redirect('/dashboard')
                                                })
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Houve um erro ao encontrar o projeto.')
                                                res.redirect('/dashboard')
                                            })
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Houve um erro ao salvar a projeto.')
                                            res.redirect('/dashboard')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Houve um erro ao salvar o cliente.')
                                        res.redirect('/dashboard')
                                    })
                                } else {
                                    if (tipo == 'novo') {
                                        novo = 'checked'
                                    } else {
                                        novo = 'unchecked'
                                    }
                                    if (tipo == 'ampliacao') {
                                        amplia = 'checked'
                                    } else {
                                        amplia = 'unchecked'
                                    }

                                    corpo = {
                                        user: id,
                                        nome: nome,
                                        endereco: endereco,
                                        numero: numero,
                                        bairro: bairro,
                                        cep: cep,
                                        complemento: complemento,
                                        cidade: cidade,
                                        uf: uf,
                                        cnpj: cnpj,
                                        cpf: cpf,
                                        contato: contato,
                                        celular: celular,
                                        email: email,
                                        lead: false,
                                    }

                                    //console.log('pessoa=>'+pessoa)
                                    if (vendedor) {
                                        Object.assign(cliente, corpo, { vendedor: pessoa })
                                    } else {
                                        Object.assign(cliente, corpo, { vendedor: req.body.vendedor })
                                    }
                                    new Cliente(cliente).save().then(() => {
                                        Cliente.findOne({ user: id }).sort({ field: 'asc', _id: -1 }).then((novo_cliente) => {
                                            //console.log('cliente cadastrado')

                                            if (tipo == 'novo') {
                                                novo = true
                                            } else {
                                                novo = false
                                            }
                                            if (tipo == 'ampliacao') {
                                                amplia = true
                                            } else {
                                                amplia = false
                                            }

                                            if (vendedor) {
                                                selvendedor = pessoa
                                            } else {
                                                selvendedor = req.body.vendedor
                                            }

                                            //console.log('params=>' + JSON.stringify(params))
                                            var ganho
                                            var status

                                            projeto = {
                                                user: id,
                                                cliente: novo_cliente._id,
                                                datacad: dataBusca(dataHoje()),
                                                endereco: endereco,
                                                numero: numero,
                                                bairro: bairro,
                                                cep: cep,
                                                complemento: complemento,
                                                cidade: cidade,
                                                uf: uf,
                                                ganho: false,
                                                encerrado: false,
                                                baixada: false,
                                                execucao: false,
                                                parado: false,
                                                entregue: false,
                                                checkpedido: false,
                                                instalado: false,
                                                autorizado: false,
                                                pago: false,
                                                seq: numprj,
                                                params: params,
                                                material: material,
                                                status: 'Enviado',
                                                novo: novo,
                                                ampliacao: amplia,
                                                telhado: req.body.telhado,
                                                orientacao: req.body.orientacao,
                                                estrutura: req.body.estrutura,
                                                concessionaria: req.body.concessionaria
                                            }

                                            Object.assign(temvendedor, projeto, { vendedor: selvendedor })

                                            if (vendedor == false) {
                                                corpoVen = {
                                                    plaQtdMod: req.body.plaQtdMod,
                                                    plaWattMod: req.body.plaWattMod,
                                                    plaQtdInv: req.body.plaQtdInv,
                                                    plaKwpInv: req.body.plaKwpInv,
                                                    plaDimArea: req.body.plaDimArea,
                                                    plaQtdString: req.body.plaQtdString,
                                                    plaModString: req.body.plaModString,
                                                    plaQtdEst: req.body.plaQtdEst,
                                                    valor: req.body.valor
                                                }
                                                Object.assign(corpo, temvendedor, corpoVen)
                                            } else {
                                                corpo = temvendedor
                                            }

                                            //console.log('corpo=>' + JSON.stringify(corpo))

                                            //console.log('corpo=>'+JSON.stringify(corpo))
                                            new Projeto(corpo).save().then(() => {
                                                Projeto.findOne({ user: id }).sort({ field: 'asc', _id: -1 }).then((novo_projeto) => {
                                                    // Cliente.findOne({ _id: novo_projeto.cliente }).then((cliente) => {
                                                    empresa.save().then(() => {
                                                        q = 0

                                                        Acesso.find({ user: id, notorc: 'checked' }).then((acesso) => {
                                                            //console.log('acesso=>' + acesso)
                                                            if (naoVazio(acesso)) {
                                                                acesso.forEach((e) => {
                                                                    Pessoa.findOne({ _id: e.pessoa }).then((pessoa) => {
                                                                        //console.log('pessoa=>' + pessoa)
                                                                        //console.log('e.nome=>' + e.nome)
                                                                        texto = 'Olá ' + pessoa.nome + ',' + '\n' +
                                                                            'O orçamento ' + novo_projeto.seq + ' para o cliente ' + novo_cliente.nome + ' foi criado dia ' + dataMensagem(dataHoje()) + ' por: ' + p.nome + '.' + '\n' +
                                                                            'Acesse https://quasat.vimmus.com.br/gerenciamento/orcamento/' + novo_projeto._id + ' e acompanhe'
                                                                        //console.log('pessoa.celular=>' + pessoa.celular)
                                                                        client.messages
                                                                            .create({
                                                                                body: texto,
                                                                                from: 'whatsapp:+554991832978',
                                                                                to: 'whatsapp:+55' + pessoa.celular
                                                                            })
                                                                            .then((message) => {
                                                                                q++
                                                                                //console.log('q=>' + q)
                                                                                //console.log('acesso.length=>' + acesso.length)
                                                                                if (q == acesso.length) {
                                                                                    req.flash('success_msg', 'Proposta adicionada com sucesso')
                                                                                    res.redirect('/gerenciamento/orcamento/' + novo_projeto._id)
                                                                                }
                                                                            }).done()

                                                                    }).catch((err) => {
                                                                        req.flash('error_msg', 'Houve um erro ao encontrar a pessoa<whats>.')
                                                                        res.redirect('/dashboard')
                                                                    })
                                                                })
                                                            } else {
                                                                req.flash('success_msg', 'Proposta adicionada com sucesso')
                                                                res.redirect('/gerenciamento/orcamento/' + novo_projeto._id)
                                                            }
                                                        }).catch((err) => {
                                                            req.flash('error_msg', 'Houve um erro ao encontrar o acesso.')
                                                            res.redirect('/dashboard')
                                                        })
                                                    }).catch((err) => {
                                                        req.flash('error_msg', 'Houve um erro ao salvar a pessoa.')
                                                        res.redirect('/dashboard')
                                                    })
                                                }).catch((err) => {
                                                    req.flash('error_msg', 'Houve um erro ao encontrar o projeto.')
                                                    res.redirect('/dashboard')
                                                })
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Houve um erro ao salvar a projeto.')
                                                res.redirect('/dashboard')
                                            })
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Não foi possível encontrar o cliente.')
                                            res.redirect('/cliente/novo')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Não foi possível cadastrar o cliente.')
                                        res.redirect('/cliente/novo')
                                    })
                                }
                            }
                        }).catch((err) => {
                            req.flash('error_msg', 'Não foi possível encontrar os parâmetros.')
                            res.redirect('/cliente/novo')
                        })
                    } catch (error) {
                        req.flash('error_msg', 'Empresa não encontrada: ' + error)
                        req.res('/gerenciamento/orcamento')
                    }

                } else {
                    const vendedor_cliente = await Pessoa.findOne({ _id: achou_cliente.vendedor })
                    try {
                        req.flash('aviso_msg', `O cliente ${achou_cliente.nome} pertence ao vendedor: ${vendedor_cliente.nome}`)
                        res.redirect('/gerenciamento/orcamento')
                    } catch (error) {
                        req.flash('error_msg', 'Vendeor não encontrado: ' + error)
                        req.res('/gerenciamento/orcamento')
                    }

                }
            } catch (error) {
                req.flash('error_msg', 'Cliente não encontrado: ' + error)
                res.redirect('/gerenciamento/orcamento')
            }
        } else {
            erros.push({ texto: 'Os campos marcados com asterisco são obrigatórios' })
            Acesso.findOne({ _id: _id }).then((acesso) => {
                //console.log('acesso.vendedor=>' + acesso.vendedor)
                if (naoVazio(acesso)) {
                    if (acesso.vendedor == true) {
                        //console.log('ehVendedor')
                        //console.log('acesso.pessoa=>' + acesso.pessoa)
                        Pessoa.findOne({ user: id, _id: acesso.pessoa }).then((ven) => {
                            res.render('principal/orcamento', { erros, vendedor, idven: ven._id, nome, endereco, uf, cidade, cpf, cnpj, contato, celular, email }) //sobrenome, 
                        }).catch((err) => {
                            req.flash('error_msg', 'Não foi possível encontrar o vendedor<ven>.')
                            res.redirect('/dashboard')
                        })
                    } else {
                        Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
                            res.render('principal/orcamento', { erros, vendedor, todos_vendedores, nome, endereco, uf, cidade, cpf, cnpj, contato, celular, email }) //sobrenome,
                        }).catch((err) => {
                            req.flash('error_msg', 'Não foi possível encontrar o vendedor<funges>.')
                            res.redirect('/dashboard')
                        })
                    }
                } else {
                    Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
                        res.render('principal/orcamento', { erros, vendedor, todos_vendedores, nome, endereco, uf, cidade, cpf, cnpj, contato, celular, email }) //sobrenome,
                    }).catch((err) => {
                        req.flash('error_msg', 'Não foi possível encontrar o vendedor<ges>.')
                        res.redirect('/dashboard')
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', 'Não foi possível encontrar o acesso.')
                res.redirect('/dashboard')
            })
        }
    }
});

router.get('/fatura/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { vendedor } = req.user
    const { funges } = req.user
    const { funpro } = req.user
    const { instalador } = req.user
    const { orcamentista } = req.user
    var id
    var idAcesso
    var lista_unidades = []
    var media = 0

    var totalJan = 0
    var totalFev = 0
    var totalMar = 0
    var totalAbr = 0
    var totalMai = 0
    var totalJun = 0
    var totalJul = 0
    var totalAgo = 0
    var totalSet = 0
    var totalOut = 0
    var totalNov = 0
    var totalDez = 0

    var ehMaster
    var proandges = false

    if (typeof user == 'undefined') {
        id = _id
        ehMaster = true
    } else {
        id = user
        ehMaster = false
    }
    Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
        //console.log('projeto=>' + projeto)
        Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente_projeto) => {
            var ehimagem
            var ehpdf
            var lista_faturas = []
            var lista = []
            lista = projeto.fatura
            lista.forEach((l) => {
                tipo = l.desc
                x = tipo.length
                y = x - 3
                tipo = tipo.slice(y, x)
                //console.log(tipo)
                if (tipo == 'pdf') {
                    ehimagem = false
                    ehpdf = true
                } else {
                    ehimagem = true
                    ehpdf = false
                }
                lista_faturas.push({ desc: l.desc, _id: l._id, ehimagem, ehpdf })
            })
            //console.log('lista=>' + lista_faturas)
            if (naoVazio(vendedor)) {
                idAcesso = _id
            } else {
                idAcesso = id
            }
            var total = 0
            var conta = 0
            if (naoVazio(projeto.uc)) {
                lista_unidades = projeto.uc
                lista_unidades.forEach((e) => {
                    total = total + e.total
                    if (parseFloat(e.jan) > 0) {
                        conta++
                    }
                    if (parseFloat(e.fev) > 0) {
                        conta++
                    }
                    if (parseFloat(e.mar) > 0) {
                        conta++
                    }
                    if (parseFloat(e.abr) > 0) {
                        conta++
                    }
                    if (parseFloat(e.mai) > 0) {
                        conta++
                    }
                    if (parseFloat(e.jun) > 0) {
                        conta++
                    }
                    if (parseFloat(e.jul) > 0) {
                        conta++
                    }
                    if (parseFloat(e.ago) > 0) {
                        conta++
                    }
                    if (parseFloat(e.set) > 0) {
                        conta++
                    }
                    if (parseFloat(e.out) > 0) {
                        conta++
                    }
                    if (parseFloat(e.nov) > 0) {
                        conta++
                    }
                    if (parseFloat(e.dez) > 0) {
                        conta++
                    }

                    totalJan = totalJan + parseFloat(e.jan)
                    totalFev = totalFev + parseFloat(e.fev)
                    totalMar = totalMar + parseFloat(e.mar)
                    totalAbr = totalAbr + parseFloat(e.abr)
                    totalMai = totalMai + parseFloat(e.mai)
                    totalJun = totalJun + parseFloat(e.jun)
                    totalJul = totalJul + parseFloat(e.jul)
                    totalAgo = totalAgo + parseFloat(e.ago)
                    totalSet = totalSet + parseFloat(e.set)
                    totalOut = totalOut + parseFloat(e.out)
                    totalNov = totalNov + parseFloat(e.nov)
                    totalDez = totalDez + parseFloat(e.dez)
                })
                media = Math.round(total / 12)
                //console.log(media)
            }
            if (funges || funpro) {
                proandges = true
            }
            //console.log('lista=>' + JSON.stringify(lista_faturas))
            res.render('principal/fatura', {
                vendedor, orcamentista, funges, ehMaster, funpro, proandges, projeto, cliente_projeto, idAcesso,
                lista_faturas, lista_unidades, media, totalJan, totalFev, totalMar, totalAbr, totalMai,
                totalJun, totalJul, totalAgo, totalSet, totalOut, totalNov, totalDez, total, seqfat: lista.length
            })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o cliente da proposta<fatura>.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar o projeto<fatura>.')
        res.redirect('/dashboard')
    })
});

router.post('/salvaruc', ehAdmin, (req, res) => {
    var iduc = req.body.iduc
    var uc = []
    var total
    var id = req.body.id
    var mes = req.body.mes
    var fator

    var totalJan = 0
    var totalFev = 0
    var totalMar = 0
    var totalAbr = 0
    var totalMai = 0
    var totalJun = 0
    var totalJul = 0
    var totalAgo = 0
    var totalSet = 0
    var totalOut = 0
    var totalNov = 0
    var totalDez = 0

    var req_jan = req.body.jan
    var req_fev = req.body.fev
    var req_mar = req.body.mar
    var req_abr = req.body.abr
    var req_mai = req.body.mai
    var req_jun = req.body.jun
    var req_jul = req.body.jul
    var req_ago = req.body.ago
    var req_set = req.body.set
    var req_out = req.body.out
    var req_nov = req.body.nov
    var req_dez = req.body.dez

    var jan = []
    var fev = []
    var mar = []
    var abr = []
    var mai = []
    var jun = []
    var jul = []
    var ago = []
    var set = []
    var out = []
    var nov = []
    var dez = []

    for (let i = 0; i < mes.length; i++) {
        if (naoVazio(req_jan[i]) == false) {
            jan.push(0)
        } else {
            jan.push(req_jan[i])
        }
        if (naoVazio(req_fev[i]) == false) {
            fev.push(0)
        } else {
            fev.push(req_fev[i])
        }
        if (naoVazio(req_mar[i]) == false) {
            mar.push(0)
        } else {
            mar.push(req_mar[i])
        }
        if (naoVazio(req_abr[i]) == false) {
            abr.push(0)
        } else {
            abr.push(req_abr[i])
        }
        if (naoVazio(req_mai[i]) == false) {
            mai.push(0)
        } else {
            mai.push(req_mai[i])
        }
        if (naoVazio(req_jun[i]) == false) {
            jun.push(0)
        } else {
            jun.push(req_jun[i])
        }
        if (naoVazio(req_jul[i]) == false) {
            jul.push(0)
        } else {
            jul.push(req_jul[i])
        }
        if (naoVazio(req_ago[i]) == false) {
            ago.push(0)
        } else {
            ago.push(req_ago[i])
        }
        if (naoVazio(req_set[i]) == false) {
            set.push(0)
        } else {
            set.push(req_set[i])
        }
        if (naoVazio(req_out[i]) == false) {
            out.push(0)
        } else {
            out.push(req_out[i])
        }
        if (naoVazio(req_nov[i]) == false) {
            nov.push(0)
        } else {
            nov.push(req_nov[i])
        }
        if (naoVazio(req_dez[i]) == false) {
            dez.push(0)
        } else {
            dez.push(req_dez[i])
        }
    }

    //console.log(qtd.length)
    //console.log('req.body.id=>' + req.body.id)
    if (mes.length > 1) {
        //console.log('iduc=>' + iduc)
        if (naoVazio(iduc)) {
            //console.log('iduc.length=>' + iduc.length)
            if (iduc.length < 24) {
                for (i = 0; i < iduc.length; i++) {
                    //console.log('iduc=>' + iduc[i])
                    Projeto.findOneAndUpdate({ _id: id }, { $pull: { 'uc': { '_id': iduc[i] } } }).then()
                }
            } else {
                Projeto.findOneAndUpdate({ _id: id }, { $pull: { 'uc': { '_id': iduc } } }).then()
            }
        }


        for (let i = 0; i < mes.length; i++) {
            total = parseFloat(jan[i]) + parseFloat(fev[i]) + parseFloat(mar[i]) + parseFloat(abr[i]) + parseFloat(mai[i]) + parseFloat(jun[i]) +
                parseFloat(jul[i]) + parseFloat(ago[i]) + parseFloat(set[i]) + parseFloat(out[i]) + parseFloat(nov[i]) + parseFloat(dez[i])
            uc.push({
                seq: i + 1, jan: jan[i], fev: fev[i], mar: mar[i], abr: abr[i], mai: mai[i], jun: jun[i],
                jul: jul[i], ago: ago[i], set: set[i], out: out[i], nov: nov[i], dez: dez[i], total: Math.round(total, 2)
            })
        }

        if (naoVazio(req.body.add)) {
            //console.log('req.body.tipoadd =>' + req.body.tipoadd)
            if (req.body.tipoadd == '%') {
                uc.forEach((e) => {
                    totalJan = totalJan + parseFloat(e.jan)
                    totalFev = totalFev + parseFloat(e.fev)
                    totalMar = totalMar + parseFloat(e.mar)
                    totalAbr = totalAbr + parseFloat(e.abr)
                    totalMai = totalMai + parseFloat(e.mai)
                    totalJun = totalJun + parseFloat(e.jun)
                    totalJul = totalJul + parseFloat(e.jul)
                    totalAgo = totalAgo + parseFloat(e.ago)
                    totalSet = totalSet + parseFloat(e.set)
                    totalOut = totalOut + parseFloat(e.out)
                    totalNov = totalNov + parseFloat(e.nov)
                    totalDez = totalDez + parseFloat(e.dez)
                })

                fator = (1 + (req.body.add / 100))
                //console.log('fator =>' + fator)
                //console.log('totalJan=>' + totalJan)
                total = Math.round((parseFloat(totalJan) * fator)) + Math.round((parseFloat(totalFev) * fator)) + Math.round((parseFloat(totalMar) * fator)) + Math.round((parseFloat(totalAbr) * fator)) + Math.round((parseFloat(totalMai) * fator)) + Math.round((parseFloat(totalJun) * fator)) +
                    Math.round((parseFloat(totalJul) * fator)) + Math.round((parseFloat(totalAgo) * fator)) + Math.round((parseFloat(totalSet) * fator)) + Math.round((parseFloat(totalOut) * fator)) + Math.round((parseFloat(totalNov) * fator)) + parseFloat(totalDez) * fator
                uc.push({
                    seq: i + 1, jan: Math.round(parseFloat(totalJan) * fator, 2), fev: Math.round(parseFloat(totalFev) * fator, 2), mar: Math.round(parseFloat(totalMar) * fator, 2), abr: Math.round(parseFloat(totalAbr) * fator, 2), mai: Math.round(parseFloat(totalMai) * fator, 2), jun: Math.round(parseFloat(totalJun) * fator, 2),
                    jul: Math.round(parseFloat(totalJul) * fator, 2), ago: Math.round(parseFloat(totalAgo) * fator, 2), set: Math.round(parseFloat(totalSet) * fator, 2), out: Math.round(parseFloat(totalOut) * fator, 2), nov: Math.round(parseFloat(totalNov) * fator, 2), dez: Math.round(parseFloat(totalDez) * fator, 2), total: Math.round(total, 2)
                })
            } else {
                //console.log('req.body.add=>' + req.body.add)
                total = parseFloat(req.body.add) * 12
                uc.push({
                    seq: i + 1, jan: parseFloat(req.body.add), fev: parseFloat(req.body.add), mar: parseFloat(req.body.add), abr: parseFloat(req.body.add), mai: parseFloat(req.body.add), jun: parseFloat(req.body.add),
                    jul: parseFloat(req.body.add), ago: parseFloat(req.body.add), set: parseFloat(req.body.add), out: parseFloat(req.body.add), nov: parseFloat(req.body.add), dez: parseFloat(req.body.add), total
                })
            }
        }
        Projeto.findOneAndUpdate({ _id: id }, { $push: { uc: uc } }).then(() => {
            Projeto.findOne({ _id: id }).then((projeto) => {
                var add
                var novoadd
                if (naoVazio(req.body.add)) {
                    if (req.body.tipoadd == '%') {
                        novoadd = total - (total / fator / 12)
                    } else {
                        novoadd = req.body.add
                    }
                } else {
                    novoadd = 0
                }
                //console.log('novoadd=>' + novoadd)
                //console.log('projeto.adduc=>' + projeto.adduc)
                if (naoVazio(projeto.adduc)) {
                    add = projeto.adduc
                } else {
                    add = 0
                }
                //console.log('add=>' + add)
                projeto.adduc = parseFloat(add) + parseFloat(novoadd)
                projeto.save().then(() => {
                    req.flash('success_msg', 'Unidades consumidoras adicionadas com sucesso.')
                    res.redirect('/gerenciamento/fatura/' + req.body.id)
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível salvar o projeto<uc_salvar>.')
                    res.redirect('/gerenciamento/fatura/' + req.body.id)
                })
            }).catch((err) => {
                req.flash('error_msg', 'Não foi possível encontrar o projeto<uc_findone_salvar>.')
                res.redirect('/gerenciamento/fatura/' + req.body.id)
            })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o projeto<uc>.')
            res.redirect('/dashboard')
        })
    } else {
        if (naoVazio(req.body.jan)) {
            jan = req.body.jan
        } else {
            jan = 0
        }
        if (naoVazio(req.body.fev)) {
            fev = req.body.fev
        } else {
            fev = 0
        }
        if (naoVazio(req.body.mar)) {
            mar = req.body.mar
        } else {
            mar = 0
        }
        if (naoVazio(req.body.abr)) {
            abr = req.body.abr
        } else {
            abr = 0
        }
        if (naoVazio(req.body.mai)) {
            mai = req.body.mai
        } else {
            mai = 0
        }
        if (naoVazio(req.body.jun)) {
            jun = req.body.jun
        } else {
            jun = 0
        }
        if (naoVazio(req.body.jul)) {
            jul = req.body.jul
        } else {
            jul = 0
        }
        if (naoVazio(req.body.ago)) {
            ago = req.body.ago
        } else {
            ago = 0
        }
        if (naoVazio(req.body.set)) {
            set = req.body.set
        } else {
            set = 0
        }
        if (naoVazio(req.body.out)) {
            out = req.body.out
        } else {
            out = 0
        }
        if (naoVazio(req.body.nov)) {
            nov = req.body.nov
        } else {
            nov = 0
        }
        if (naoVazio(req.body.dez)) {
            dez = req.body.dez
        } else {
            dez = 0
        }
        //console.log('iduc=>' + iduc)
        Projeto.findOneAndUpdate({ _id: id }, { $pull: { 'uc': { '_id': iduc } } }).then()
        //console.log('req.body.add=>' + req.body.add)
        //console.log('req.body.tipoadd=>' + req.body.tipoadd)
        if (naoVazio(req.body.add)) {
            if (req.body.tipoadd == '%') {
                fator = (1 + (req.body.add / 100))
                //console.log('fator=>' + fator)
                total = parseFloat(jan) + parseFloat(fev) + parseFloat(mar) + parseFloat(abr) + parseFloat(mai) + parseFloat(jun) +
                    parseFloat(jul) + parseFloat(ago) + parseFloat(set) + parseFloat(out) + parseFloat(nov) + parseFloat(dez)
                uc.push({
                    seq: 1, jan: parseFloat(jan), fev: parseFloat(fev), mar: parseFloat(mar), abr: parseFloat(abr), mai: parseFloat(mai), jun: parseFloat(jun),
                    jul: parseFloat(jul), ago: parseFloat(ago), set: parseFloat(set), out: parseFloat(out), nov: parseFloat(nov), dez: parseFloat(dez), total
                })
                total = Math.round((parseFloat(fev) * fator)) + Math.round((parseFloat(fev) * fator)) + Math.round((parseFloat(mar) * fator)) + Math.round((parseFloat(abr) * fator)) + Math.round((parseFloat(mai) * fator)) + Math.round((parseFloat(jun) * fator)) +
                    Math.round((parseFloat(jul) * fator)) + Math.round((parseFloat(ago) * fator)) + Math.round((parseFloat(set) * fator)) + Math.round((parseFloat(out) * fator)) + Math.round((parseFloat(nov) * fator)) + parseFloat(dez) * fator
                uc.push({
                    seq: 2, jan: Math.round(parseFloat(jan) * fator), fev: Math.round(parseFloat(fev) * fator), mar: Math.round(parseFloat(mar) * fator), abr: Math.round(parseFloat(abr) * fator), mai: Math.round(parseFloat(mai) * fator), jun: Math.round(parseFloat(jun) * fator),
                    jul: Math.round(parseFloat(jul) * fator), ago: Math.round(parseFloat(ago) * fator), set: Math.round(parseFloat(set) * fator), out: Math.round(parseFloat(out) * fator), nov: Math.round(parseFloat(nov) * fator), dez: Math.round(parseFloat(dez) * fator), total: Math.round(total, 2)
                })
            } else {
                //console.log('add=>' + add)
                total = parseFloat(jan) + parseFloat(fev) + parseFloat(mar) + parseFloat(abr) + parseFloat(mai) + parseFloat(jun) +
                    parseFloat(jul) + parseFloat(ago) + parseFloat(set) + parseFloat(out) + parseFloat(nov) + parseFloat(dez)
                //console.log('total=>' + total)
                uc.push({
                    seq: 1, jan: parseFloat(jan), fev: parseFloat(fev), mar: parseFloat(mar), abr: parseFloat(abr), mai: parseFloat(mai), jun: parseFloat(jun),
                    jul: parseFloat(jul), ago: parseFloat(ago), set: parseFloat(set), out: parseFloat(out), nov: parseFloat(nov), dez: parseFloat(dez), total
                })
                total = parseFloat(req.body.add) + parseFloat(req.body.add) + parseFloat(req.body.add) + parseFloat(req.body.add) + parseFloat(req.body.add) + parseFloat(req.body.add) +
                    parseFloat(req.body.add) + parseFloat(req.body.add) + parseFloat(req.body.add) + parseFloat(req.body.add) + parseFloat(req.body.add) + parseFloat(req.body.add)
                //console.log('total=>' + total)
                uc.push({
                    seq: 2, jan: parseFloat(req.body.add), fev: parseFloat(req.body.add), mar: parseFloat(req.body.add), abr: parseFloat(req.body.add), mai: parseFloat(req.body.add), jun: parseFloat(req.body.add),
                    jul: parseFloat(req.body.add), ago: parseFloat(req.body.add), set: parseFloat(req.body.add), out: parseFloat(req.body.add), nov: parseFloat(req.body.add), dez: parseFloat(req.body.add), total
                })
            }
        } else {
            total = parseFloat(req.body.jan) + parseFloat(req.body.fev) + parseFloat(req.body.mar) + parseFloat(req.body.abr) + parseFloat(req.body.mai) + parseFloat(req.body.jun) +
                parseFloat(req.body.jul) + parseFloat(req.body.ago) + parseFloat(req.body.set) + parseFloat(req.body.out) + parseFloat(req.body.nov) + parseFloat(req.body.dez)
            //console.log('total=>' + total)
            uc.push({
                seq: 1, jan: parseFloat(req.body.jan), fev: parseFloat(req.body.fev), mar: parseFloat(req.body.mar), abr: parseFloat(req.body.abr), mai: parseFloat(req.body.mai), jun: parseFloat(req.body.jun),
                jul: parseFloat(req.body.jul), ago: parseFloat(req.body.ago), set: parseFloat(req.body.set), out: parseFloat(req.body.out), nov: parseFloat(req.body.nov), dez: parseFloat(req.body.dez), total: Math.round(total, 2)
            })
        }

        Projeto.findOneAndUpdate({ _id: id }, { $push: { uc: uc } }).then(() => {
            Projeto.findOne({ _id: id }).then((projeto) => {
                var add
                var novoadd
                if (naoVazio(req.body.add)) {
                    if (req.body.tipoadd == '%') {
                        novoadd = total - (total / fator / 12)
                    } else {
                        novoadd = req.body.add
                    }
                } else {
                    novoadd = 0
                }
                //console.log('novoadd=>' + novoadd)
                //console.log('projeto.adduc=>' + projeto.adduc)
                if (naoVazio(projeto.adduc)) {
                    add = projeto.adduc
                } else {
                    add = 0
                }
                //console.log('add=>' + add)
                projeto.adduc = parseFloat(add) + parseFloat(novoadd)
                projeto.save().then(() => {
                    req.flash('success_msg', 'Unidades consumidoras adicionadas com sucesso.')
                    res.redirect('/gerenciamento/fatura/' + req.body.id)
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível salvar o projeto<uc_salvar>.')
                    res.redirect('/gerenciamento/fatura/' + req.body.id)
                })
            }).catch((err) => {
                req.flash('error_msg', 'Não foi possível encontrar o projeto<uc_findone_salvar>.')
                res.redirect('/gerenciamento/fatura/' + req.body.id)
            })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o projeto<uc>.')
            res.redirect('/dashboard')
        })
    }
});

router.get('/confirmaexclusao/:id', ehAdmin, (req, res) => {
    Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
        res.render('principal/confirmaexclusao', { projeto })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar o projeto')
        res.redirect('/relatorios/consulta')
    })
});

router.get('/propostaEntregue/:id', ehAdmin, (req, res) => {
    Projeto.findOne({ _id: req.params.id }).then((projeto) => {
        projeto.entregue = true
        projeto.dtentrega = dataHoje()
        projeto.status = "Entregue"
        projeto.save().then(() => {
            res.redirect('/dashboard')
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o projeto<entregue>.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar o projeto<entregue>.')
        res.redirect('/dashboard')
    })
});

router.get('/deletauc/:id', ehAdmin, (req, res) => {
    var params = req.params.id
    params = params.split('@')
    //console.log('params[0]=>' + params[0])
    //console.log('params[1]=>' + params[1])
    Projeto.findOneAndUpdate({ _id: params[1] }, { $pull: { 'uc': { '_id': params[0] } } }).then(() => {
        req.flash('success_msg', 'Unidade consumidora excluída.')
        res.redirect('/gerenciamento/fatura/' + params[1])
    })
});

router.get('/ganho/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id
    var q = 0
    var s = 0
    var texto = ''
    var tarefa

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    Projeto.findOne({ _id: req.params.id }).then((projeto) => {
        Cliente.findOne({ _id: projeto.cliente }).then((cliente) => {
            projeto.ganho = true
            projeto.status = 'Ganho'
            projeto.datastatus = dataHoje()
            const corpo = {
                user: id,
                nome_projeto: cliente.nome,
                liberar: false,
                prjfeito: false,
                feito: true,
                parado: false,
                projeto: req.params.id,
                dtinicio: dataHoje(),
                dtfim: dataHoje(),
                dtinibusca: dataBusca(dataHoje()),
                dtfimbusca: dataBusca(dataHoje())
            }
            new Equipe(corpo).save().then(() => {
                Equipe.findOne({ user: id }).sort({ field: 'asc', _id: -1 }).then((equipe) => {
                    projeto.save().then(() => {
                        AtvPadrao.find({ user: id }).then((atv) => {
                            atv.forEach((e) => {
                                //console.log('e=>' + e.descricao)
                                s++
                                tarefa = {
                                    user: id,
                                    projeto: req.params.id,
                                    descricao: e.descricao,
                                    equipe: equipe,
                                    seq: s,
                                    tipo: 'padrao',
                                    emandamento: false
                                }
                                //console.log('tarefa=>' + tarefa)
                                new Tarefas(tarefa).save().then(() => {
                                    //console.log('q=>' + q)
                                    q++
                                    if (q == atv.length) {
                                        q = 0
                                        Acesso.find({ user: id, notgan: 'checked' }).then((acesso) => {
                                            //console.log('acesso=>' + acesso)
                                            if (naoVazio(acesso)) {
                                                acesso.forEach((e) => {
                                                    Pessoa.findOne({ _id: e.pessoa }).then((pessoa) => {
                                                        //console.log('pessoa=>' + pessoa)
                                                        texto = 'Olá ' + pessoa.nome + ',' + '\n' +
                                                            'PROPOSTA GANHA!' + '\n' +
                                                            'A proposta ' + projeto.seq + ' do cliente ' + cliente.nome + ' esta ganha. ' + '\n ' +
                                                            'Acesse https://quasat.vimmus.com.br/gerenciamento/orcamento/' + projeto._id + ' e acompanhe.'

                                                        //console.log('pessoa.celular=>' + pessoa.celular)

                                                        client.messages
                                                            .create({
                                                                body: texto,
                                                                from: 'whatsapp:+554991832978',
                                                                to: 'whatsapp:+55' + pessoa.celular
                                                            })
                                                            .then((message) => {
                                                                q++
                                                                //console.log('q=>' + q)
                                                                //console.log('acesso.length=>' + acesso.length)
                                                                if (q == acesso.length) {
                                                                    //console.log(message.sid)
                                                                    req.flash('success_msg', 'Proposta ' + projeto.seq + ' ganha.')
                                                                    res.redirect('/dashboard/')
                                                                }
                                                            }).done()

                                                    }).catch((err) => {
                                                        req.flash('error_msg', 'Houve um erro ao encontrar a pessoa<whats>.')
                                                        res.redirect('/dashboard')
                                                    })
                                                })
                                            } else {
                                                req.flash('success_msg', projeto.seq + ' ganha.')
                                                res.redirect('/gerenciamento/orcamento/' + req.params.id)
                                            }
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Houve um erro ao encontrar o acesso.')
                                            res.redirect('/dashboard')
                                        })
                                    }
                                }).catch((err) => {
                                    req.flash('error_msg', 'Houve erro ao salvar a tarefa.')
                                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                })
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve erro ao encontrar as atividades padrão.')
                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                        })
                    }).catch(() => {
                        req.flash('error_msg', 'Falha ao salvar a equipe.')
                        res.redirect('/gerenciamento/orcamento/' + req.params.id)
                    })
                })
            }).catch(() => {
                req.flash('error_msg', 'Falha ao salvar o projeto.')
                res.redirect('/gerenciamento/orcamento/' + req.params.id)
            })
        }).catch(() => {
            req.flash('error_msg', 'Falha ao encontrar o cliente.')
            res.redirect('/gerenciamento/orcamento/' + req.params.id)
        })
    }).catch(() => {
        req.flash('error_msg', 'Falha ao encontrar o projeto.')
        res.redirect('/gerenciamento/orcamento/' + req.params.id)
    })
});

router.get('/recuperar/:id', ehAdmin, (req, res) => {
    //console.log("req.params.docimg=>" + req.params.docimg)
    Projeto.findOne({ _id: req.params.id }).then((projeto) => {
        projeto.baixada = false
        projeto.status = 'Negociando'
        projeto.save().then(() => {
            req.flash('success_msg', 'Proposta recuperada.')
            res.redirect('/dashboard')
        })
    }).catch(() => {
        req.flash('error_msg', 'Falha ao encontrar o projeto.')
        res.redirect('/gerenciamento/selecao/' + req.body.id)
    })
});

router.get('/desfazerGanho/:id', ehAdmin, (req, res) => {
    //console.log("req.params.docimg=>" + req.params.docimg)
    Projeto.findOne({ _id: req.params.id }).then((projeto) => {
        projeto.ganho = false
        projeto.entregue = true
        projeto.dtentrega = dataHoje()
        projeto.status = 'Enviado'
        projeto.save().then(() => {
            req.flash('success_msg', 'Proposta ganha desfeita.')
            res.redirect('/dashboard/')
        })
    }).catch(() => {
        req.flash('error_msg', 'Falha ao encontrat o projeto')
        res.redirect('/dashboard/')
    })
});

router.get('/desfazerEntregue/:id', ehAdmin, (req, res) => {
    //console.log("req.params.docimg=>" + req.params.docimg)
    Projeto.findOne({ _id: req.params.id }).then((projeto) => {
        projeto.ganho = false
        projeto.entregue = false
        projeto.dtentrega = dataHoje()
        projeto.status = 'Enviado'
        projeto.save().then(() => {
            req.flash('success_msg', 'Proposta ganha desfeita.')
            res.redirect('/dashboard/')
        })
    }).catch(() => {
        req.flash('error_msg', 'Falha ao encontrat o projeto')
        res.redirect('/dashboard/')
    })
});

router.get('/entrega/:id', ehAdmin, (req, res) => {
    var id
    const { _id } = req.user
    const { user } = req.user
    var instalado = true
    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    Projeto.findOne({ _id: req.params.id }).then((projeto) => {
        Equipe.findOne({ _id: projeto.equipe }).then((equipe) => {

            instalado = projeto.instalado

            if (instalado) {
                if (projeto.encerrado == false) {
                    req.flash('aviso_msg', 'Projeto encerrado')
                    projeto.status = 'Instalação Realizada'
                    projeto.encerrado = true
                    projeto.save().then(() => {
                        Usina.findOne({ projeto: req.params.id }).then((usina) => {
                            //console.log('usina=>' + naoVazio(usina))
                            if (naoVazio(usina) == false) {
                                var cadastro = dataHoje()
                                var datalimp = dataMensagem(setData(dataHoje(), 182))
                                var buscalimp = dataBusca(setData(dataHoje(), 182))
                                var datarevi = dataMensagem(setData(dataHoje(), 30))
                                var buscarevi = dataBusca(setData(dataHoje(), 30))

                                const usina = {
                                    user: id,
                                    nome: equipe.nome_projeto,
                                    projeto: projeto._id,
                                    cliente: projeto.cliente,
                                    endereco: projeto.endereco,
                                    area: 0,
                                    qtdmod: 0,
                                    cadastro: cadastro,
                                    datalimp: datalimp,
                                    buscalimp: buscalimp,
                                    datarevi: datarevi,
                                    buscarevi: buscarevi
                                }

                                new Usina(usina).save().then(() => {
                                    //console.log('salvou usina')
                                    Usina.findOne({ user: id }).sort({ field: 'asc', _id: -1 }).then((novausina) => {
                                        const tarefa = {
                                            user: id,
                                            usina: novausina._id,
                                            dataini: setData(dataHoje(), 182),
                                            buscadataini: dataBusca(setData(dataHoje(), 182)),
                                            datafim: setData(dataHoje(), 182),
                                            buscadatafim: dataBusca(setData(dataHoje(), 182)),
                                            cadastro: dataHoje(),
                                            endereco: projeto.endereco,
                                            concluido: false,
                                            equipe: null,
                                            tipo: 'programacao',
                                            emandamento: false
                                        }
                                        new Tarefas(tarefa).save().then(() => {
                                            req.flash('success_msg', 'Usina gerada com sucesso.')
                                            res.redirect('/gerenciamento/orcamento/' + req.params.id)
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Erro ao salvar a tarefa.')
                                            res.redirect('/gerenciamento/orcamento/' + req.params.id)
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Erro ao encontrar a usina.')
                                        res.redirect('/gerenciamento/instalacao/' + req.params.id)
                                    })
                                })
                            } else {
                                req.flash('aviso_msg', ' usina já foi gerada.')
                                res.redirect('/gerenciamento/instalacao/' + req.params.id)
                            }
                        }).catch((err) => {
                            req.flash('error_msg', 'Erro ao salvar a equipe.')
                            res.redirect('/gerenciamento/instalacao/' + req.params.id)
                        })
                    })
                } else {
                    projeto.encerrado = false
                    projeto.status = 'Ganho'
                    projeto.save().then(() => {
                        Usina.findOneAndDelete({ projeto: req.params.id }).then(() => {
                            req.flash('aviso_msg', 'Projeto em aberto.')
                            res.redirect('/gerenciamento/orcamento/' + req.params.id)
                        }).catch((err) => {
                            req.flash('error_msg', 'Erro ao deletar a usina.')
                            res.redirect('/gerenciamento/orcamento/' + req.params.id)
                        })
                    }).catch(() => {
                        req.flash('error_msg', 'Falha ao salvar o projeto.')
                        res.redirect('/gerenciamento/instalacao/' + req.params.id)
                    })
                }
            } else {
                projeto.instalado = true
                projeto.save().then(() => {
                    equipe.prjfeito = true
                    equipe.save().then(() => {
                        res.redirect('/gerenciamento/instalacao/' + req.params.id)
                    }).catch(() => {
                        req.flash('error_msg', 'Falha ao salvar o projeto.')
                        res.redirect('/gerenciamento/instalacao/' + req.params.id)
                    })
                })
            }

        }).catch(() => {
            req.flash('error_msg', 'Falha ao encontrar a equipe.')
            res.redirect('/gerenciamento/instalacao/' + req.params.id)
        })
    }).catch(() => {
        req.flash('error_msg', 'Falha ao encontrar o projeto.')
        res.redirect('/gerenciamento/instalacao/' + req.params.id)
    })
});

router.get('/orcamento/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { vendedor } = req.user
    const { funges } = req.user
    const { funpro } = req.user
    const { pessoa } = req.user
    const { orcamentista } = req.user
    var proandges = false
    var ehMaster = false

    var id
    if (naoVazio(user)) {
        id = user
        ehMaster = false
    } else {
        id = _id
        ehMaster = true
    }

    var lista_proposta = []
    var lista_obs = ''
    var check30 = 'unchecked'
    var check45 = 'unchecked'
    var check60 = 'unchecked'
    var idAcesso
    var ultima_proposta
    var descricao = ''
    var nome_cliente = ''
    var aux = ''
    var lista_itens = []
    var lista_params = []
    var options = ''
    var selectini = ''
    var selectfim = ''
    var campo = ''
    var tipo = ''
    var dados = []
    var x = 0
    var vrlServico = 0
    var desctermo = ''
    var vistoria = false
    var termo = ''

    var lancarPedido = false
    if (orcamentista || funges || naoVazio(user) == false) {
        lancarPedido = true
    }

    if (funges || funpro) {
        proandges = true
    } else {
        proandges = false
    }

    Empresa.findOne({ user: id }).lean().then((empresa) => {
        //console.log('vendedor=>' + vendedor)
        //console.log('funges=>' + funges)
        //console.log('orcamentista=>' + orcamentista)
        Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
            Pedido.findOne({ _id: projeto.pedido }).lean().then((pedido) => {
                dados = projeto.params

                //console.log('dados=>'+JSON.stringify(dados))
                //console.log('solar=>' + projeto.solar)
                if (projeto.ampliacao) {
                    tipo = 'ampliacao'
                } else {
                    tipo = 'novo'
                }

                lista_proposta = projeto.proposta
                lista_proposta.forEach((e) => {
                    if (naoVazio(e.obs)) {
                        lista_obs = lista_obs + e.obs + '\n'
                    }
                })
                if (naoVazio(lista_proposta)) {
                    ultima_proposta = lista_proposta[lista_proposta.length - 1]
                    descricao = ultima_proposta.arquivo
                }

                if (projeto.prazo == 30) {
                    check30 = 'checked'
                } else {
                    if (projeto.prazo = 45) {
                        check45 = 'checked'
                    } else {
                        check60 = 'checked'
                    }
                }

                if (projeto.plaQtdMod) {
                    vlrServico = parseFloat(projeto.plaQtdMod) * empresa.vlrmdo
                } else {
                    vlrServico = '0,00'
                }
                var vlrKit = parseFloat(projeto.valor) - parseFloat(vlrServico)
                //console.log('vrlKit=>' + vlrKit)

                Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente_projeto) => {
                    Pessoa.findOne({ _id: projeto.vendedor }).lean().then((ven_projeto) => {
                        Agenda.findOne({ cliente: projeto.cliente }).lean().then((agenda) => {
                            Componente.find({ user: id, classificacao: 'solar' }).lean().then((equipamento) => {
                                Parametros.find({ user: id, tipo: 'solar' }).then((parametros) => {
                                    //console.log('dados=>' + dados)
                                    parametros.forEach((e) => {
                                        if (naoVazio(e.valor)) {
                                            valor = e.valor.split(';')
                                            if (valor.length > 1) {
                                                selectini = '<select name="params[]" class="form-select form-select-sm mb-1">'
                                                selectfim = '</select>'
                                                for (let i = 0; i < valor.length; i++) {
                                                    //console.log('i=>'+i)
                                                    //console.log('valor=>'+valor[i])
                                                    options = options + '<option value="' + valor[i] + '">' + valor[i] + '</option>'
                                                }
                                                //console.log('dados=>' + dados[x].descricao)
                                                //console.log('valor=>' + e.descricao)
                                                if (dados[x].descricao == e.descricao) {
                                                    options = '<option class="fw-bold" value="' + dados[x].valor + '">' + dados[x].valor + '</option>' + options
                                                }
                                                campo = selectini + options + selectfim
                                            } else {
                                                //console.log('input type text')
                                                if (naoVazio(dados)) {
                                                    campo = '<input type="text" class="form-control form-control-sm mb-1" name="params[]" value="' + dados[x].valor + '">'
                                                } else {
                                                    campo = '<input type="text" class="form-control form-control-sm mb-1" name="params[]" value="">'
                                                }
                                            }
                                        } else {
                                            //console.log('input type text vazio')
                                            //console.log('dados=>' + dados)
                                            if (naoVazio(dados)) {
                                                campo = '<input type="text" class="form-control form-control-sm mb-1" name="params[]" value="' + dados[x].valor + '">'
                                            } else {
                                                campo = '<input type="text" class="form-control form-control-sm mb-1" name="params[]" value="">'
                                            }
                                        }
                                        lista_itens.push({ desc: e.descricao })
                                        //console.log('campo=>' + campo)
                                        //console.log('descricao=>' + e.descricao)
                                        lista_params.push({ id: e._id, descricao: e.descricao, campo })
                                        campo = ''
                                        options = ''
                                        x++
                                    })
                                    //console.log('lista_params=>' + lista_params)
                                    if (vendedor == true && funges == false && orcamentista == false && funpro == false) {
                                        //console.log('req.params.id=>' + req.params.id)
                                        //console.log('ven_projeto._id=>'+ven_projeto._id)
                                        //console.log('lista_obs=>' + lista_obs)
                                        if (naoVazio(projeto.dataPost) && naoVazio(projeto.dataSoli) && naoVazio(projeto.dataApro)) {
                                            vistoria = true
                                            termo = projeto.termo
                                            if (naoVazio(termo)) {
                                                desctermo = termo[0].desc
                                            }
                                        }
                                        if (naoVazio(projeto.responsavel)) {
                                            //console.log('entrou responsavel')
                                            Pessoa.findOne({ _id: projeto.responsavel }).lean().then((responsavel) => {
                                                //console.log('lista_params=>' + JSON.stringify(lista_params))
                                                if (naoVazio(agenda)) {
                                                    res.render('principal/orcamento', { tipo, pedido, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, responsavel, equipamento, vistoria, lista_itens, lista_params, desctermo, agenda, empresa, descricao, vendedor, cliente_projeto, ven_projeto, projeto, idAcesso: _id, lista_proposta, lista_obs })
                                                } else {
                                                    res.render('principal/orcamento', { tipo, pedido, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, responsavel, equipamento, vistoria, lista_itens, lista_params, desctermo, empresa, descricao, vendedor, cliente_projeto, ven_projeto, projeto, idAcesso: _id, lista_proposta, lista_obs })
                                                }

                                            }).catch((err) => {
                                                req.flash('error_msg', 'Não foi possível encontrar o responsável do projeto.')
                                                res.redirect('/dashboard')
                                            })
                                        } else {
                                            if (naoVazio(agenda)) {
                                                res.render('principal/orcamento', { tipo, pedido, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, equipamento, vistoria, lista_itens, lista_params, desctermo, agenda, empresa, descricao, vendedor, cliente_projeto, ven_projeto, projeto, idAcesso: _id, lista_proposta, lista_obs })
                                            } else {
                                                res.render('principal/orcamento', { tipo, pedido, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, equipamento, vistoria, lista_itens, lista_params, desctermo, empresa, descricao, vendedor, cliente_projeto, ven_projeto, projeto, idAcesso: _id, lista_proposta, lista_obs })
                                            }
                                        }
                                    } else {
                                        //console.log('lista_proposta=>' + projeto.proposta)
                                        //console.log("descricao=>"+descricao)
                                        Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
                                            // Equipe.findOne({ _id: projeto.equipe }).lean().then((lista_equipe) => {
                                            //console.log('projeto.pedido=>' + projeto.pedido)
                                            //console.log("sem pedido")
                                            //console.log('projeto.termo=>' + projeto.termo)
                                            termo = projeto.termo
                                            if (naoVazio(termo)) {
                                                desctermo = termo[0].desc
                                            }
                                            //console.log("desctermo=>" + desctermo)
                                            aux = cliente_projeto.nome
                                            aux = aux.split(' ')
                                            for (let i = 0; i < aux.length; i++) {
                                                nome_cliente = nome_cliente + aux[i]
                                            }
                                            if (naoVazio(projeto.responsavel)) {
                                                //console.log('entrou responsavel')
                                                Pessoa.findOne({ _id: projeto.responsavel }).lean().then((responsavel) => {
                                                    if (naoVazio(agenda)) {
                                                        res.render('principal/orcamento', { tipo, pedido, desctermo, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, equipamento, agenda, lista_params, lista_itens, empresa, descricao, orcamentista, vendedor, lancarPedido, funpro, funges, ehMaster, proandges, cliente_projeto, nome_cliente, responsavel, todos_vendedores, ven_projeto, projeto, idAcesso: id, lista_proposta, lista_obs })
                                                    } else {
                                                        res.render('principal/orcamento', { tipo, pedido, desctermo, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, equipamento, lista_params, lista_itens, empresa, descricao, orcamentista, vendedor, funpro, lancarPedido, funges, ehMaster, proandges, cliente_projeto, nome_cliente, responsavel, todos_vendedores, ven_projeto, projeto, idAcesso: id, lista_proposta, lista_obs })
                                                    }
                                                    //console.log('projeto.cliente=>' + projeto.cliente)
                                                }).catch((err) => {
                                                    req.flash('error_msg', 'Não foi possível encontrar o responsável do projeto.')
                                                    res.redirect('/dashboard')
                                                })
                                            } else {
                                                //console.log('orcamentista=>' + orcamentista)
                                                //console.log('orcamentista=>' + orcamentista)
                                                //console.log('pessoa=>' + pessoa)
                                                if (funges == true || orcamentista == true || funpro == true) {
                                                    //console.log('pessoa=>' + pessoa._id)
                                                    Projeto.findOneAndUpdate({ _id: req.params.id }, { $set: { 'responsavel': pessoa } }).then(() => {
                                                        //console.log('update=>')
                                                        if (naoVazio(agenda)) {
                                                            res.render('principal/orcamento', { tipo, pedido, desctermo, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, equipamento, agenda, lista_params, lista_itens, empresa, descricao, orcamentista, lancarPedido, funpro, funges, ehMaster, proandges, cliente_projeto, nome_cliente, todos_vendedores, ven_projeto, projeto, idAcesso: id, lista_proposta, lista_obs })
                                                        } else {
                                                            res.render('principal/orcamento', { tipo, pedido, desctermo, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, equipamento, lista_params, lista_itens, empresa, descricao, orcamentista, funpro, lancarPedido, funges, ehMaster, proandges, cliente_projeto, nome_cliente, todos_vendedores, ven_projeto, projeto, idAcesso: id, lista_proposta, lista_obs })
                                                        }
                                                    })
                                                } else {
                                                    if (naoVazio(agenda)) {
                                                        res.render('principal/orcamento', { tipo, pedido, desctermo, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, equipamento, agenda, lista_params, lista_itens, empresa, descricao, lancarPedido, funges, ehMaster, proandges, cliente_projeto, nome_cliente, todos_vendedores, ven_projeto, projeto, idAcesso: id, lista_proposta })
                                                    } else {
                                                        res.render('principal/orcamento', { tipo, pedido, desctermo, vlrKit, vlrServico, vlrMascaraServico: mascaraDecimal(vlrServico), check30, check45, check60, equipamento, empresa, lista_params, lista_itens, descricao, lancarPedido, funges, ehMaster, proandges, cliente_projeto, nome_cliente, todos_vendedores, ven_projeto, projeto, idAcesso: id, lista_proposta })
                                                    }
                                                }
                                            }
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Não foi possível encontrar o responsável.')
                                            res.redirect('/dashboard')
                                        })
                                    }
                                }).catch((err) => {
                                    req.flash('error_msg', 'Não foi possível encontrar os parâmetros.')
                                    res.redirect('/dashboard')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Não foi possível encontrar os componentes.')
                                res.redirect('/dashboard')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Não foi possível encontrar a agenda do cliente.')
                            res.redirect('/dashboard')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Não foi possível encontrar o responsável do projeto.')
                        res.redirect('/dashboard')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível encontrar o cliente da proposta<orcamento master>.')
                    res.redirect('/dashboard')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Não foi possível encontrar o pedido.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o projeto.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar a empresa.')
        res.redirect('/dashboard')
    })
});

router.post('/proposta', upload.single('proposta'), ehAdmin, (req, res) => {
    var file
    //console.log('req.file=>' + req.file)
    if (req.file != null) {
        file = req.file.originalname
    } else {
        file = ''
    }
    var proposta = []
    //console.log('file=>' + file)
    Projeto.findOne({ _id: req.body.id }).then((projeto) => {
        var propostas = []
        propostas = projeto.proposta
        var x = propostas.length
        //console.log("x=>" + x)
        if (naoVazio(x)) {
            var ultimo = propostas[x - 1]
            var seq = parseFloat(ultimo.seq) + 1
        } else {
            seq = 1
        }

        proposta = { seq, arquivo: req.body.seq + '_' + file, data: dataMensagem(req.body.dtcadastro), validade: dataMensagem(req.body.dtvalidade) }
        
        Cliente.findOne({ _id: projeto.cliente }).then((cliente) => {
            Pessoa.findOne({ _id: projeto.vendedor, notpro: 'checked' }).then((vendedor) => {
                //console.log('projeto.responsavel=>' + projeto.responsavel)
                if (naoVazio(projeto.responsavel)) {
                    Pessoa.findOne({ _id: projeto.responsavel }).then((responsavel) => {
                        Projeto.findOneAndUpdate({ _id: req.body.id }, { $push: { proposta: proposta } }).then((e) => {
                            if (naoVazio(vendedor)) {
                                var texto = 'Olá ' + vendedor.nome + ',' + '\n' +
                                    'Uma nova proposta do projeto ' + projeto.seq + ' para o cliente ' + cliente.nome + ' foi adicionada por: ' + responsavel.nome + ' dia ' + dataMensagem(dataHoje()) + '.' + '\n' +
                                    'Acesse e acompanhe https://quasat.vimmus.com.br/gerenciamento/orcamento/' + projeto._id + '.'

                                //console.log('vendedor.celular=>' + vendedor.celular)

                                client.messages
                                    .create({
                                        body: texto,
                                        from: 'whatsapp:+554991832978',
                                        to: 'whatsapp:+55' + vendedor.celular
                                    })
                                    .then((message) => {
                                        //console.log(message.sid)
                                        req.flash('success_msg', 'Proposta adicionada com sucesso')
                                        res.redirect('/gerenciamento/orcamento/' + req.body.id)

                                    }).done()
                            } else {
                                req.flash('success_msg', 'Proposta adicionada com sucesso')
                                res.redirect('/gerenciamento/orcamento/' + req.body.id)
                            }
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve erro ao salvar a proposta.')
                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve erro ao econtrar o vendedor.')
                        res.redirect('/gerenciamento/orcamento/' + req.body.id)
                    })
                } else {
                    //console.log("entrou como gestor")
                    Projeto.findOneAndUpdate({ _id: req.body.id }, { $push: { proposta: proposta } }).then((e) => {
                        req.flash('aviso_msg', 'Nenhum orçamentista será avisado sobre o upload da proposta. Solicite à um orçamentista para gerenciar esta proposta.')
                        res.redirect('/gerenciamento/orcamento/' + req.body.id)
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve erro ao salvar a proposta.')
                        res.redirect('/gerenciamento/orcamento/' + req.body.id)
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', 'Houve erro ao econtrar o vendedor.')
                res.redirect('/gerenciamento/orcamento/' + req.body.id)
            })
        }).catch((err) => {
            req.flash('error_msg', 'Houve erro ao encontrar o cliente.')
            res.redirect('/gerenciamento/orcamento/' + req.body.id)
        })
    }).catch((err) => {
        req.flash('error_msg', 'Houve erro ao encontrar o projeto.')
        res.redirect('/gerenciamento/orcamento/' + req.body.id)
    })
});

router.get('/exportarOrcamento/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    var workbook = new excel.Workbook()

    Empresa.findOne({ user: id }).then((empresa) => {
        Projeto.findOne({ _id: req.params.id }).then((projeto) => {
            Pessoa.findOne({ _id: projeto.vendedor }).then((vendedor) => {
                Cliente.findOne({ _id: projeto.cliente }).then((cliente) => {
                    var arquivo = 'orcamento_' + projeto.seq + '_' + cliente.nome + dataHoje() + '.xlsx'
                    workbook.xlsx.readFile('./upload/orcamento.xlsx')
                        .then(function () {
                            var row
                            var desc
                            var lista = []
                            var wslista = workbook.getWorksheet('Painel e Inversor')
                            for (i = 60; i < 76; i++) {
                                row = wslista.getRow(i)
                                desc = '"' + row.getCell(2).value + '"'
                                lista.push(desc.toString())
                            }
                            var wscalc = workbook.getWorksheet('Cálculo')
                            //console.log(lista)
                            wscalc.getCell('B17').dataValidation = {
                                type: 'list',
                                allowBlank: true,
                                formulae: [lista]
                            }
                            var wsdados = workbook.getWorksheet('DADOS')
                            row = wsdados.getRow(2)
                            //cabeçalho
                            row.getCell(2).value = vendedor.nome
                            //nome cliente
                            row.getCell(3).value = cliente.nome
                            //documento
                            //console.log('cpf=>'+cliente.cpf)
                            //console.log('cnpj=>'+cliente.cnpj)
                            if (cliente.cpf != '0') {
                                row.getCell(4).value = 'CPF'
                                row.getCell(5).value = cliente.cpf
                            } else {
                                row.getCell(4).value = 'CNPJ'
                                row.getCell(5).value = cliente.cnpj
                            }
                            //número proposta
                            row.getCell(6).value = projeto.seq
                            //endereço
                            row.getCell(7).value = projeto.endereco
                            //contato
                            row.getCell(8).value = cliente.celular
                            //cidade
                            row.getCell(9).value = projeto.cidade
                            //cidade
                            //console.log('projeto.datacad=>' + projeto.datacad)
                            row.getCell(10).value = dataMensagem(dataInput(String(projeto.datacad)))
                            //unidades consumidoras      
                            //janeiro          
                            var uc = projeto.uc
                            i = 4
                            uc.forEach((e) => {
                                //console.log('i=>' + i)
                                row = wsdados.getRow(16)
                                //console.log(' e.jan=>' + e.jan)
                                row.getCell(i).value = e.jan
                                //fevereiro          
                                row = wsdados.getRow(17)
                                row.getCell(i).value = e.fev
                                //março          
                                row = wsdados.getRow(18)
                                row.getCell(i).value = e.mar
                                //abril          
                                row = wsdados.getRow(19)
                                row.getCell(i).value = e.abr
                                //maio          
                                row = wsdados.getRow(20)
                                row.getCell(i).value = e.mai
                                //junho          
                                row = wsdados.getRow(21)
                                row.getCell(i).value = e.jun
                                //julho          
                                row = wsdados.getRow(22)
                                row.getCell(i).value = e.jul
                                //agosto          
                                row = wsdados.getRow(23)
                                row.getCell(i).value = e.ago
                                //setembro          
                                row = wsdados.getRow(24)
                                row.getCell(i).value = e.set
                                //outubro          
                                row = wsdados.getRow(25)
                                row.getCell(i).value = e.out
                                //novembro          
                                row = wsdados.getRow(26)
                                row.getCell(i).value = e.nov
                                //dezembro         
                                row = wsdados.getRow(27)
                                row.getCell(i).value = e.dez
                                i++
                            })
                            //configuracao perdas
                            var perda
                            //console.log('empresa.perdaoeste=>'+empresa.perdaoeste)
                            switch (projeto.orientacao) {
                                case 'Oeste':
                                    perda = empresa.perdaoeste
                                    break;
                                case 'Leste':
                                    perda = empresa.perdaleste
                                    break;
                                case 'Norte':
                                    perda = empresa.perdanorte
                                    break;
                                case 'Nordeste':
                                    perda = empresa.perdanordeste
                                    break;
                                case 'Noroeste':
                                    perda = empresa.perdanoroeste
                                    break;
                            }
                            row = wsdados.getRow(79)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(80)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(81)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(82)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(83)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(84)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(85)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(86)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(87)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(88)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(89)
                            row.getCell(3).value = perda
                            row = wsdados.getRow(90)
                            row.getCell(3).value = perda
                            row.commit()

                            res.setHeader(
                                "Content-Type",
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            )
                            res.setHeader(
                                "Content-Disposition",
                                "attachment; filename=" + arquivo
                            )
                            workbook.xlsx.write(res).then(function () {
                                res.end()
                            })
                        })
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar o cliente')
                    res.redirect('/relatorios/consulta')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar o vendedor')
                res.redirect('/relatorios/consulta')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao encontrar o projeto')
            res.redirect('/relatorios/consulta')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar a empresa')
        res.redirect('/relatorios/consulta')
    })
});

router.post('/observacao', ehAdmin, (req, res) => {
    var texto = ''
    var texto_salvo = ''
    var mensagem = ''
    const { _id } = req.user
    const { user } = req.user
    const { vendedor } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    texto = '[' + dataMensagem(dataHoje()) + ']' + '\n' + req.body.obs

    Projeto.findOne({ _id: req.body.id }).then((prj) => {
        Cliente.findOne({ _id: prj.cliente }).then((cliente) => {
            Pessoa.findOne({ _id: prj.vendedor }).then((pes_ven) => {
                Pessoa.findOne({ _id: prj.responsavel }).then((pes_res) => {

                    if (naoVazio(prj.obs)) {
                        texto_salvo = prj.obs + '\n' + texto
                    } else {
                        texto_salvo = texto
                    }

                    if (vendedor == true) {
                        Acesso.findOne({ pessoa: prj.responsavel, notobs: 'checked' }).then((acesso_responsavel) => {
                            if (naoVazio(acesso_responsavel)) {
                                mensagem = 'Olá ' + pes_res.nome + ',' + '\n' +
                                    'Foi adicionada uma observação à proposta: ' + prj.seq + ' do cliente: ' + cliente.nome + '\n' +
                                    'Mensagem: ' + req.body.obs + '\n' +
                                    'Acesse: https://quasat.vimmus.com.br/orcamento/' + prj._id + ' para mais informações.'

                                client.messages
                                    .create({
                                        body: mensagem,
                                        from: 'whatsapp:+554991832978',
                                        to: 'whatsapp:+55' + pes_res.celular
                                    })
                                    .then((message) => {
                                        Projeto.findOneAndUpdate({ _id: req.body.id }, { $set: { obs: texto_salvo } }).then(() => {
                                            req.flash('success_msg', 'Observação adicionada com sucesso')
                                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Houve um erro ao salvar a observação.')
                                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                        })
                                    }).done()
                            } else {
                                Projeto.findOneAndUpdate({ _id: req.body.id }, { $set: { obs: texto_salvo } }).then(() => {
                                    req.flash('success_msg', 'Observação adicionada com sucesso')
                                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                }).catch((err) => {
                                    req.flash('error_msg', 'Houve um erro ao salvar a observação.')
                                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                })
                            }
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve um erro ao encontrar o acesso.')
                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                        })
                    } else {
                        Acesso.findOne({ pessoa: prj.vendedor, notobs: 'checked' }).then((acesso_vendedor) => {

                            if (naoVazio(acesso_vendedor)) {

                                mensagem = 'Olá ' + pes_ven.nome + ',' + '\n' +
                                    'Foi adicionada uma observação à proposta: ' + prj.seq + ' do cliente: ' + cliente.nome + '\n' +
                                    'Mensagem: ' + req.body.obs + '\n' +
                                    'Acesse: https://quasat.vimmus.com.br/orcamento/' + prj._id + ' para mais informações.'

                                client.messages
                                    .create({
                                        body: mensagem,
                                        from: 'whatsapp:+554991832978',
                                        to: 'whatsapp:+55' + pes_ven.celular
                                    })
                                    .then((message) => {
                                        //console.log(message.sid)
                                        Projeto.findOneAndUpdate({ _id: req.body.id, }, { $set: { 'obs': texto_salvo } }).then(() => {
                                            req.flash('success_msg', 'Observação adicionada com sucesso')
                                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Houve um erro ao salvar a observação.')
                                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                        })

                                    }).done()

                            } else {
                                Projeto.findOneAndUpdate({ _id: req.body.id, }, { $set: { 'obs': texto_salvo } }).then(() => {
                                    req.flash('success_msg', 'Observação adicionada com sucesso')
                                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                }).catch((err) => {
                                    req.flash('error_msg', 'Houve um erro ao salvar a observação.')
                                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                })
                            }
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve um erro ao encontrar o acesso.')
                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                        })
                    }
                }).catch((err) => {
                    req.flash('error_msg', 'Houve um erro ao encontrar a pessoa.')
                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                })
            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro ao encontrar o cliente.')
                res.redirect('/gerenciamento/orcamento/' + req.body.id)
            })
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro ao encontrar o projeto.')
            res.redirect('/gerenciamento/orcamento/' + req.body.id)
        })
    })
});

router.get('/deletarProposta/:id', ehAdmin, (req, res) => {
    var params = req.params.id
    params = params.split('@')
    //console.log('params[0]=>' + params[0])
    //console.log('params[1]=>' + params[1])
    Projeto.findOneAndUpdate({ 'proposta._id': params[0] }, { $pull: { 'proposta': { '_id': params[0] } } }).then(() => {
        req.flash('success_msg', 'Proposta removida com sucesso.')
        res.redirect('/gerenciamento/orcamento/' + params[1])
    }).catch((err) => {
        req.flash('error_msg', 'Houve erro ao excluir a proposta.')
        res.redirect('/gerenciamento/orcamento/' + params[1])
    })
});

router.get('/confirmabaixa/:id', ehAdmin, (req, res) => {
    const { vendedor } = req.user
    Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
        Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente) => {
            res.render('principal/confirmabaixa', { projeto, cliente, vendedor })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o cliente<status>.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar o projeto<status>.')
        res.redirect('/dashboard')
    })
});

router.get('/confirmastatus/:id', ehAdmin, (req, res) => {
    const { vendedor } = req.user
    Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
        Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente) => {
            res.render('principal/confirmastatus', { projeto, cliente, vendedor })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o cliente<status>.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar o projeto<status>.')
        res.redirect('/dashboard')
    })
});


router.post('/aplicarstatus/', ehAdmin, (req, res) => {
    const { vendedor } = req.user
    Projeto.findOne({ _id: req.body.id }).then((p) => {
        var texto

        if (req.body.tipo == 'status') {

            if (naoVazio(p.descstatus)) {
                texto = p.descstatus
            } else {
                texto = ''
            }

            if (naoVazio(req.body.obs)) {
                texto = texto + '\n' + '[' + dataMensagem(dataHoje()) + ']' + '-' + req.body.status + '\n' + req.body.obs
            }

            p.status = req.body.status
            p.descstatus = texto
            p.datastatus = dataHoje()

            p.save().then(() => {
                req.flash('success_msg', 'Status da negociacão alterado.')
                if (naoVazio(vendedor)) {
                    res.redirect('/dashboard')
                } else {
                    res.redirect('/gerenciamento/selecao')
                }

            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro ao salvar a projeto.')
                res.redirect('/gerenciamento/selecao/')
            })
        } else {

            if (naoVazio(p.descmot)) {
                texto = p.descmot
            } else {
                texto = ''
            }

            if (naoVazio(req.body.obs)) {
                texto = texto + '\n' + '[' + dataMensagem(dataHoje()) + ']' + '-' + req.body.motivo + '\n' + req.body.obs
            }

            p.baixada = true
            p.status = 'Perdido'
            p.motivo = req.body.motivo
            p.dtbaixa = dataHoje()
            p.descmot = texto
            p.save().then(() => {
                req.flash('success_msg', 'Projeto baixado')
                if (naoVazio(vendedor)) {
                    res.redirect('/dashboard')
                } else {
                    res.redirect('/gerenciamento/selecao')
                }
            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro ao salvar a projeto.')
                res.redirect('/gerenciamento/selecao/')
            })
        }
    })
});

module.exports = router;

