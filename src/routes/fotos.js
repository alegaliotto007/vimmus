const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const aws = require("aws-sdk");
const multer = require('multer');
const multerS3 = require("multer-s3");
const resizeImg = require('resize-image-buffer');
require('dotenv').config();

const listaFotos = require('../resources/listaFotos');

require('../model/Projeto');
require('../model/Cliente');
require('../model/Tarefas');
require('../model/Acesso');
require('../model/Pessoa');

const { ehAdmin } = require('../helpers/ehAdmin');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const Acesso = mongoose.model('acesso');
const Cliente = mongoose.model('cliente');
const Pessoa = mongoose.model('pessoa');
const Tarefas = mongoose.model('tarefas');
const Projeto = mongoose.model('projeto');

const dataMensagem = require('../resources/dataMensagem');
const dataHoje = require('../resources/dataHoje');
const naoVazio = require('../resources/naoVazio');

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
})

router.get('/fotoslocal/:id', ehAdmin, async (req, res) => {
    const projeto = await Projeto.findById(req.params.id);
    var lista_local = [];
    if (naoVazio(projeto.local)) {
        lista_local = listaFotos(projeto.local);
    }
    res.render('principal/fotoslocal', { lista_local })
});

router.get('/mostrarFotos/:id', ehAdmin, (req, res) => {
    //console.log('entrou')
    var lista_imagens = []
    var img = []
    var params = req.params.id
    //console.log('params=>' + params)
    params = params.split('@')
    //console.log('tarefa=>' + params[0])
    //console.log('projeto=>' + params[1])
    //console.log('proposta vazio')
    if (params[0] == 'assistencia') {
        //console.log("entrou")
        Tarefas.findOne({ _id: params[1] }).lean().then((tarefa) => {
            img = tarefa.fotos
            //console.log('img.length=>' + img.length)
            img.forEach((e) => {
                lista_imagens.push({ imagem: e.desc, id: params[1] })
            })
            res.render('principal/mostrarFotos', { assistencia: true, lista_imagens, tarefa, seqrf: img.length })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar a tarefa.')
            res.redirect('/gerenciamento/mostrarFotos/' + params[1])
        })
    } else {
        Tarefas.findOne({ _id: params[1] }).lean().then((tarefa) => {
            Projeto.findOne({ _id: tarefa.projeto }).lean().then((projeto) => {
                Tarefas.find({ projeto: params[2] }).lean().then((tarefas) => {

                    img = tarefa.fotos
                    //console.log('img=>' + img.length)
                    if (img.length > 0) {
                        //console.log('img.length=>' + img.length)
                        img.forEach((e) => {
                            lista_imagens.push({ imagem: e.desc, id: params[1] })
                        })
                    }
                    //console.log('lista_imagens=>' + lista_imagens)
                    res.render('principal/mostrarFotos', { lista_imagens, tarefa, tarefas, projeto, titulo: tarefa.descricao, seqtrf: img.length })
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível encontrar as tarefas.')
                    res.redirect('/dashboard')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Não foi possível encontrar o projeto.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar a tarefa.')
            res.redirect('/dashboard')
        })
    }
});

router.get('/fotos', ehAdmin, (req, res) => {
    res.render('principal/fotos')
});

router.get('/fotos/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { vendedor } = req.user
    const { funges } = req.user
    const { funpro } = req.user
    const { instalador } = req.user
    const { orcamentista } = req.user
    var id
    var proandges = false

    if (naoVazio(user)) {
        id = user
        ehMaster = false
    } else {
        id = _id
        ehMaster = true
    }

    Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
        console.log('projeto=>' + projeto)
        console.log('projeto.cliente=>' + projeto.cliente)
        Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente_projeto) => {

            let lista_proposta = projeto.proposta
            console.log('lista_proposta=>' + lista_proposta)
            let lista_doc = []
            let lista_local = []
            let lista_entrada = []
            let lista_disjuntor = []
            let lista_trafo = []
            let lista_telhado = []
            let lista_localizacao = []
            let lista_medidor = []
            if (naoVazio(projeto.documento)) {
                lista_doc = listaFotos(projeto.documento)
            }
            if (naoVazio(projeto.local)) {
                lista_local = listaFotos(projeto.local)
            }
            if (naoVazio(projeto.entrada)) {
                lista_entrada = listaFotos(projeto.entrada)
            }
            if (naoVazio(projeto.disjuntor)) {
                lista_disjuntor = listaFotos(projeto.disjuntor)
            }
            console.log('projeto.trafo=>' + projeto.trafo);
            if (naoVazio(projeto.trafo)) {
                lista_trafo = listaFotos(projeto.trafo)
            }
            if (naoVazio(projeto.telhado_foto)) {
                lista_telhado = listaFotos(projeto.telhado_foto)
            }
            if (naoVazio(projeto.localizacao)) {
                lista_localizacao = listaFotos(projeto.localizacao)
            }
            if (naoVazio(projeto.medidor)) {
                lista_medidor = listaFotos(projeto.medidor)
            }

            if (funges || funpro) {
                proandges = true
            } else {
                proandges = false
            }
            res.render('principal/fotos', {
                vendedor, orcamentista, funges, funpro, proandges, projeto, cliente_projeto,
                lista_doc, lista_local, lista_entrada, lista_disjuntor, lista_trafo, lista_localizacao, lista_telhado, lista_medidor,
                seqdoc: lista_doc.length, seqlocal: lista_local.length, seqent: lista_entrada.length, seqdis: lista_disjuntor.length, seqmed: lista_medidor.length,
                seqtra: lista_trafo.length, seqloc: lista_localizacao.length, seqtel: lista_telhado.length, lista_proposta
            })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o cliente da proposta<fotos>.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar o projeto<fotos>.')
        res.redirect('/dashboard')
    })
});

router.get('/verFotos/:id', ehAdmin, (req, res) => {
    var img = []
    var lista = []
    //console.log('req.params.id=>' + req.params.id)
    Tarefas.findOne({ _id: req.params.id }).lean().then((tarefas) => {
        img = tarefas.fotos
        img.forEach((i) => {
            //console.log('i.desc=>' + i.desc)
            lista.push({ id: tarefas._id, imagem: i.desc, atv: tarefas.desc })
        })
        res.render('principal/verfotos', { tarefas, idprj: tarefas.projeto, lista })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar as tarefas.')
        res.redirect('/dashboard')
    })
});

router.post('/salvarImagem', ehAdmin, upload.array('files', 20), (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id
    var cont = 0
    var notimg = true
    var q = 0

    //console.log('req.file.path=>'+req.files.path)

    // (async() =>  {
    //     await sharp(req.files.path)
    //     .resize(540,960)
    //     .png({quality: 90})
    //     .toFile(
    //         path.resolve(req.file.destination, 'resize', image)
    //     )
    // })

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var arquivos = req.files
    //console.log('req.files=>' + req.files)
    var imagem
    var ativo = false
    var mensagem
    const vardate = new Date().getSeconds() + '_' + new Date().getFullYear() + '_' + new Date().getMonth() + '_' + new Date().getDate() + '_'

    //console.log("tipo=>" + req.body.tipo)
    //console.log("id=>" + req.body.idprj)

    if (naoVazio(arquivos)) {
        //console.log('arquivos=>' + arquivos.length)
        arquivos.forEach((e) => {
            if (req.body.tipo == 'assistencia') {
                imagem = { fotos: { "desc": req.body.seq + '_' + e.originalname, "data": dataHoje() }, }

                Tarefas.findOneAndUpdate({ _id: req.body.id }, { $set: { datafim: dataHoje() } }).then((e) => {
                    Tarefas.findOneAndUpdate({ _id: req.body.id }, { $push: imagem }).then((e) => {
                        var concluido = {}
                        concluido = { 'concluido': true, 'solucao': req.body.solucao }

                        //console.log('concluido=>' + JSON.stringify(concluido))
                        Tarefas.findOneAndUpdate({ _id: req.body.id }, concluido).then((e) => {

                            res.redirect('/gerenciamento/assistencia')

                        }).catch((err) => {
                            req.flash('error_msg', 'Houve erro ao encontrar a tarefa.')
                            res.redirect('/dashboard')
                        })
                    })
                })
            } else {
                //console.log('req.body.idprj=>' + req.body.idprj)
                Projeto.findOne({ _id: req.body.idprj }).then((prj) => {
                    Cliente.findOne({ _id: prj.cliente }).then((cliente) => {
                        if (req.body.tipo == 'projeto') {
                            console.log("caminho=>" + req.body.caminho)
                            if ((req.body.caminho == 'fatura') || (req.body.caminho == 'documento') || (req.body.caminho == 'entrada')
                                || (req.body.caminho == 'disjuntor') || (req.body.caminho == 'trafo') || (req.body.caminho == 'localizacao'
                                    || (req.body.caminho == 'telhado') || req.body.caminho == 'local')
                                || (req.body.caminho == 'medidor')) {
                                //console.log('é telhado=>' + req.body.seq)
                                imagem = { "desc": req.body.seq + '_' + e.originalname, "data": dataHoje() }
                            } else {
                                imagem = { "desc": req.body.seq + '_' + e.originalname }
                            }

                            var disjuntor
                            var medidor
                            var trafo
                            if (req.body.caminho == 'disjuntor') {
                                console.log('entrou disjuntor')
                                disjuntor = imagem
                                medidor = prj.medidor
                                trafo = prj.trafo
                            }
                            if (req.body.caminho == 'medidor') {
                                medidor = imagem
                                disjuntor = prj.disjuntor
                                trafo = prj.trafo
                            }
                            if (req.body.caminho == 'trafo') {
                                trafo = imagem
                                disjuntor = prj.disjuntor
                                medidor = prj.medidor
                            }

                            //console.log('caminho=>' + req.body.caminho)
                            //console.log('disjuntor=>' + naoVazio(disjuntor))
                            //console.log('medidor=>' + naoVazio(medidor))
                            //console.log('trafo=>' + naoVazio(trafo))

                            var levantamento = false
                            if ((req.body.caminho == 'disjuntor' || req.body.caminho == 'medidor' || req.body.caminho == 'trafo') &&
                                (naoVazio(disjuntor) && naoVazio(medidor) && naoVazio(trafo))) {
                                levantamento = true
                            }

                            console.log('levantamento=>' + levantamento)
                            var texto
                            if (req.body.caminho == 'fatura') {
                                Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $push: { fatura: imagem } }).then((e) => {
                                    texto = 'Fatura(s) salva(s) com sucesso.'
                                })
                            } else {
                                if (req.body.caminho == 'documento') {
                                    Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $push: { documento: imagem } }).then((e) => {
                                        texto = 'Documento(s) salvo(s) com sucesso.'
                                    })
                                } else {
                                    if (req.body.caminho == 'local') {
                                        Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $push: { local: imagem } }).then((e) => {
                                            texto = 'Local(ais) salvo(s) com sucesso.'
                                        })
                                    } else {
                                        if (req.body.caminho == 'entrada') {
                                            Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $push: { entrada: imagem } }).then((e) => {
                                                texto = 'Entrada(s) salva(s) com sucesso.'
                                            })
                                        } else {
                                            if (req.body.caminho == 'disjuntor') {
                                                console.log('push disjuntor')
                                                Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $push: { disjuntor: imagem } }).then((e) => {
                                                    if (!levantamento) {
                                                        texto = 'Disjuntor(es) salvo(s) com sucesso.'
                                                    }
                                                })
                                            } else {
                                                if (req.body.caminho == 'trafo') {
                                                    Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $push: { trafo: imagem } }).then((e) => {
                                                        if (!levantamento) {
                                                            texto = 'Trafo(s) salvo(s) com sucesso.'
                                                        }
                                                    })
                                                } else {
                                                    if (req.body.caminho == 'localizacao') {
                                                        Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $push: { localizacao: imagem } }).then((e) => {
                                                            texto = 'Localização(ões) salva(s) com sucesso.'
                                                        })
                                                    } else {
                                                        if (req.body.caminho == 'telhado') {
                                                            //console.log('salva telhado=>' + req.body.idprj)
                                                            Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $push: { telhado_foto: imagem } }).then((e) => {
                                                                texto = 'Foto(s) do(s) telhado(s) salva(s) com sucesso.'
                                                            })
                                                        } else {
                                                            if (req.body.caminho == 'medidor') {
                                                                Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $push: { medidor: imagem } }).then((e) => {
                                                                    if (!levantamento) {
                                                                        texto = 'Medidor(ees) salvo(s) com sucesso.'
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if (levantamento) {
                                console.log('levantamento de rede')
                                Acesso.find({ user: id, notdoc: 'checked' }).then((acesso) => {
                                    if (naoVazio(acesso)) {
                                        acesso.forEach((e) => {
                                            Pessoa.findOne({ _id: e.pessoa }).then((projetista) => {
                                                //console.log(pessoa.celular)
                                                mensagem = 'Olá ' + projetista.nome + ',' + '\n' +
                                                    'O levantamento de rede da proposta ' + prj.seq + ' foi adicionado.' + '\n' +
                                                    'Acesse: https://quasat.vimmus.com.br/orcamento/' + prj._id + ' para mais informações.'
                                                client.messages
                                                    .create({
                                                        body: mensagem,
                                                        from: 'whatsapp:+554991832978',
                                                        to: 'whatsapp:+55' + projetista.celular
                                                    })
                                                    .then((message) => {
                                                        //console.log(message.sid)
                                                        cont++
                                                        //console.log('cont=>' + cont)
                                                        if (cont == acesso.length) {
                                                            req.flash('success_msg', 'Levantamento de rede realizado com sucesso.')
                                                            res.redirect('/gerenciamento/fotos/' + req.body.idprj)
                                                        }
                                                    }).done()
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Houve erro ao encontrar o projetista.')
                                                res.redirect('/gerenciamento/fotos/' + req.body.idprj)
                                            })
                                        })
                                    } else {
                                        //console.log('aguardando')
                                        if (req.body.caminho == 'fatura') {
                                            req.flash('success_msg', 'Imagem salva com sucesso')
                                            res.redirect('/gerenciamento/fatura/' + req.body.idprj)
                                        } else {
                                            //console.log('texto=>' + texto)
                                            req.flash('success_msg', texto)
                                            res.redirect('/gerenciamento/fotos/' + req.body.idprj)
                                        }
                                    }
                                }).catch((err) => {
                                    req.flash('error_msg', 'Houve erro ao encontrar o acesso.')
                                    res.redirect('/gerenciamento/fotos/' + req.body.idprj)
                                })
                            } else {
                                if (req.body.caminho == 'fatura') {
                                    req.flash('success_msg', 'Imagem da fatura salva com sucesso')
                                    res.redirect('/gerenciamento/fatura/' + req.body.idprj)
                                } else {
                                    req.flash('success_msg', texto)
                                    res.redirect('/gerenciamento/fotos/' + req.body.idprj)
                                }
                            }
                        } else {
                            if (req.body.tipo == 'tarefa') {
                                //console.log('instalação')
                                //console.log('req.body.check=>' + req.body.check)
                                if (req.body.check == 'Aprovado') {
                                    ativo = true
                                } else {
                                    ativo = false
                                }


                                imagem = { fotos: { "desc": req.body.seq + '_' + e.originalname, "data": dataHoje() } }

                                Tarefas.findOneAndUpdate({ _id: req.body.id }, { $push: imagem }).then((e) => {
                                    Tarefas.findOneAndUpdate({ _id: req.body.id }, { $set: { datafim: dataHoje() } }).then((e) => {
                                        req.flash('success_msg', 'Foto(s) da instalação salva(s) com sucesso.')
                                    })
                                })

                                var concluido = {}
                                concluido = { 'concluido': ativo }

                                //console.log('concluido=>' + JSON.stringify(concluido))
                                //console.log('req.body.id=>' + req.body.id)
                                Tarefas.findOneAndUpdate({ _id: req.body.id }, concluido).then((e) => {
                                    Tarefas.find({ projeto: req.body.idprj }).then(async (lista_tarefas) => {
                                        if (ativo == true) {
                                            req.flash('success_msg', 'Imagem(ns) da(s) instalação aprovada(s)')
                                            await Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $set: { instalado: true } })
                                        }

                                        lista_tarefas.forEach((e) => {
                                            //console.log('e.fotos=>' + e.fotos)
                                            if (naoVazio(e.fotos) == false) {
                                                notimg = false
                                            }
                                        })
                                        if (notimg == true) {
                                            Acesso.find({ user: id, notimg: 'checked' }).then((acesso) => {
                                                if (naoVazio(acesso)) {
                                                    acesso.forEach((e) => {
                                                        Pessoa.findOne({ _id: e.pessoa }).then((pessoa) => {
                                                            //console.log('enviou mensagem')
                                                            texto = 'Olá ' + pessoa.nome + ',' + '\n' +
                                                                'Todas as fotos da obra do projeto ' + prj.seq + ' para o cliente ' + cliente.nome + '  estão na plataforma. ' +
                                                                'Acesse https://vimmus.com.br/gerenciamento/orcamento/' + prj._id + ' para verificar.'
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
                                                                        if (req.body.caminho == 'instalacao') {
                                                                            if (req.body.usuario == 'gestor') {
                                                                                //console.log('req.body.idprj=>' + req.body.idprj)
                                                                                res.redirect('/gerenciamento/instalacao/' + req.body.idprj)
                                                                            } else {
                                                                                res.redirect('/gerenciamento/mostrarFotos/tarefa@' + req.body.id + '@' + req.body.idprj)
                                                                            }
                                                                        } else {
                                                                            res.redirect('/gerenciamento/mostraEquipe/' + req.body.id)
                                                                        }
                                                                    }
                                                                }).done()

                                                        }).catch((err) => {
                                                            req.flash('error_msg', 'Houve um erro ao encontrar a pessoa<whats>.')
                                                            res.redirect('/dashboard')
                                                        })
                                                    })
                                                } else {
                                                    if (req.body.caminho == 'instalacao') {
                                                        if (req.body.usuario == 'gestor') {
                                                            //console.log('req.body.idprj=>' + req.body.idprj)
                                                            res.redirect('/gerenciamento/instalacao/' + req.body.idprj)
                                                        } else {
                                                            res.redirect('/gerenciamento/mostrarFotos/tarefa@' + req.body.id + '@' + req.body.idprj)
                                                        }
                                                    } else {
                                                        res.redirect('/gerenciamento/mostraEquipe/' + req.body.id)
                                                    }
                                                }
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Houve erro ao encontrar o acesso.')
                                                res.redirect('/gerenciamento/fotos/' + req.body.id)
                                            })
                                        } else {
                                            if (req.body.caminho == 'instalacao') {
                                                if (req.body.usuario == 'gestor') {
                                                    //console.log('req.body.idprj=>' + req.body.idprj)
                                                    res.redirect('/gerenciamento/instalacao/' + req.body.idprj)
                                                } else {
                                                    res.redirect('/gerenciamento/mostrarFotos/tarefa@' + req.body.id + '@' + req.body.idprj)
                                                }
                                            } else {
                                                res.redirect('/gerenciamento/mostraEquipe/' + req.body.id)
                                            }
                                        }
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Houve erro ao encontrar a tarefa.')
                                        res.redirect('/dashboard')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Houve erro ao encontrar a tarefa.')
                                    res.redirect('/dashboard')
                                })
                            } else {
                                if (req.body.tipo == 'termo') {
                                    //console.log('entrou termo')
                                    Projeto.findOneAndUpdate({ _id: req.body.idprj }, { $set: { termo: { "desc": req.body.seq + '_' + e.originalname, "data": dataHoje() } } }).then((e) => {
                                        req.flash('success_msg', 'Termo de entrega salvo com sucesso.')
                                        res.redirect('/gerenciamento/orcamento/' + req.body.idprj)
                                    })
                                }
                            }
                        }
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve erro ao encontrar o cliente.')
                        res.redirect('/gerenciamento/fotos/' + req.body.id)
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Houve erro ao encontrar o projeto.')
                    res.redirect('/gerenciamento/fotos/' + req.body.id)
                })
            }
        })
    } else {
        if (req.body.tipo == 'tarefa') {
            //console.log('aprovação')
            //console.log('req.body.check=>' + req.body.check)
            if (req.body.check == 'Aprovado') {
                ativo = true
            } else {
                ativo = false
            }

            //console.log('req.body.id=>' + req.body.id)
            Tarefas.findOneAndUpdate({ _id: req.body.id }, { $set: { concluido: ativo } }).then((e) => {
                if (ativo == true) {
                    req.flash('success_msg', 'Imagem(ns) da(s) instalação aprovada(s)')
                } else {
                    req.flash('success_msg', 'Imagem(ns) da(s) instalação para averiguar(s)')
                }
                if (req.body.caminho == 'instalacao') {
                    if (req.body.usuario == 'gestor') {
                        //console.log('req.body.idprj=>' + req.body.idprj)
                        res.redirect('/gerenciamento/instalacao/' + req.body.idprj)
                    } else {
                        res.redirect('/gerenciamento/mostrarFotos/tarefa@' + req.body.id + '@' + req.body.idprj)
                    }
                } else {
                    res.redirect('/gerenciamento/mostraEquipe/' + req.body.id)
                }
            }).catch((err) => {
                req.flash('error_msg', 'Houve erro ao encontrar a tarefa.')
                res.redirect('/dashboard')
            })
        } else {
            req.flash('aviso_mag', 'Nenhum arquivo adicionado.')
            res.redirect('/gerenciamento/fotos/' + req.body.id)
        }
    }
});

router.get('/deletaImagem/:msg', ehAdmin, (req, res) => {
    var params = []
    params = req.params.msg
    params = params.split('delimg')
    //console.log('params[1]=>'+params[1])
    //console.log('params[2]=>' + params[2])
    //console.log('params[3]=>' + params[3])
    if (params[2] == 'fatura') {
        Projeto.findOneAndUpdate({ _id: params[3] }, { $pull: { 'fatura': { '_id': params[1] } } }).then(() => {
            req.flash('success_msg', 'Imagem da fatura removida com sucesso.')
            res.redirect('/gerenciamento/fatura/' + params[3])
        }).catch((err) => {
            req.flash('error_msg', 'Houve erro ao excluir a equipe.')
            res.redirect('/gerenciamento/orcamento/' + params[3])
        })
    } else {
        if (params[2] == 'fotos') {
            var sql = {}
            if (params[4] == 'documento') {
                //console.log('params[1]=>' + params[1])
                sql = { 'documento': { '_id': params[1] } }
            }
            if (params[4] == 'local') {
                //console.log('params[1]=>' + params[1])
                sql = { 'local': { '_id': params[1] } }
            }
            if (params[4] == 'entrada') {
                sql = { 'entrada': { '_id': params[1] } }
            }
            if (params[4] == 'disjuntor') {
                sql = { 'disjuntor': { '_id': params[1] } }
            }
            if (params[4] == 'trafo') {
                sql = { 'trafo': { '_id': params[1] } }
            }
            if (params[4] == 'localizacao') {
                sql = { 'localizacao': { '_id': params[1] } }
            }
            if (params[4] == 'telhado') {
                sql = { 'telhado_foto': { '_id': params[1] } }
            }
            if (params[4] == 'medidor') {
                sql = { 'medidor': { '_id': params[1] } }
            }
            //console.log('params[3]=>' + params[3])
            //console.log('sql=>' + JSON.stringify(sql))
            Projeto.findOneAndUpdate({ _id: params[3] }, { $pull: sql }).then(() => {
                req.flash('success_msg', 'Imagem removida com sucesso.')
                if (params[2] == 'fatura') {
                    res.redirect('/gerenciamento/fatura/' + params[3])
                } else {
                    res.redirect('/gerenciamento/fotos/' + params[3])
                }
            }).catch((err) => {
                req.flash('error_msg', 'Houve erro ao excluir a equipe.')
                res.redirect('/gerenciamento/fotos/' + params[3])
            })
        } else {
            if (params[2] == 'tarefa') {
                //console.log('entrou')
                Tarefas.findOneAndUpdate({ _id: params[1] }, { $pull: { 'fotos': { 'desc': params[0] } } }).then((e) => {
                    req.flash('aviso_msg', 'Imagem removida com sucesso')
                    //console.log('params[1]=>' + params[1])
                    if (params[3] == 'gestao') {
                        res.redirect('/gerenciamento/verFotos/' + params[1])
                    } else {
                        res.redirect('/gerenciamento/mostrarFotos/tarefa@' + params[1] + '@' + params[3])
                    }
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao remover a imagem.')
                    res.redirect('/gerenciamento/instalacao/' + params[1])
                })
            } else {
                if (params[2] == 'assistencia') {
                    //console.log('entrou')
                    Tarefas.findOneAndUpdate({ _id: params[1] }, { $pull: { 'fotos': { 'desc': params[0] } } }).then((e) => {
                        req.flash('aviso_msg', 'Imagem removida com sucesso')
                        //console.log('params[1]=>' + params[1])
                        if (params[3] == 'gestao') {
                            res.redirect('/gerenciamento/verFotos/' + params[1])
                        } else {
                            res.redirect('/gerenciamento/mostrarFotos/assistencia@' + params[1])
                        }
                    }).catch((err) => {
                        req.flash('error_msg', 'Falha ao remover a imagem.')
                        res.redirect('/gerenciamento/instalacao/' + params[1])
                    })
                }
            }
        }
    }
});

router.post('/salvarFotos', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    var img = []
    var imgblob = []
    var foto = []
    var listaBuffer = []
    var ib
    var params
    var q = 0
    var mensagem
    var texto
    var notimg = true
    var imagem

    //console.log('salvar fotos')

    img = req.body.imagem
    imgblob = req.body.imgblob
    //console.log('img.length=>' + img.length)
    if (img.length < 100) {
        (async () => {
            await img.forEach((i) => {

                ib = imgblob[q].replace('blob:https://quasat.vimmus.com.br/', '')
                //ib = imgblob[q].replace('blob:http://localhost:3001/', '')
                ib = ib + '.png'

                data = i.replace(/^data:image\/\w+;base64,/, "")
                buf = Buffer.from(data, "base64")

                // (async () => {
                //     imagem = await resizeImg(buf, {
                //         width: 540,
                //         height: 960,
                //     })
                // })

                listaBuffer.push({ buffer: buf })
                foto.push({ "desc": ib, 'data': dataMensagem(dataHoje()) })
                q++
            })
        })()
        for (i = 0; i < q; i++) {

            ib = imgblob[i].replace('blob:https://quasat.vimmus.com.br/', '')
            //ib = imgblob[i].replace('blob:http://localhost:3001/', '')
            ib = ib + '.png'

            params = {
                Bucket: 'quasatimg',
                Key: ib,
                Body: listaBuffer[i].buffer
            }
            s3.upload(params, function (err, data) {
                if (err) {
                    throw err
                } else {
                    //console.log('Upload realizado com sucesso.')
                }
            })
        }

    } else {
        //console.log('lendo diretório')
        (async () => {

            ib = imgblob.replace('blob:https://quasat.vimmus.com.br/', '');
            //ib = imgblob.replace('blob:http://localhost:3001/', '')
            ib = ib + '.png';
            //console.log('ib=>' + ib)
            // strip off the data: url prefix to get just the base64-encoded bytes
            data = img.replace(/^data:image\/\w+;base64,/, "");
            buf = Buffer.from(data, "base64");
            imagem = await resizeImg(buf, {
                width: 540,
                height: 960,
            })

            foto.push({ "desc": ib, 'data': dataMensagem(dataHoje()) });

            //console.log('ib=>' + ib)

            params = {
                Bucket: 'quasatimg',
                Key: ib,
                Body: imagem
            }

            s3.upload(params, function (err, data) {
                if (err) {
                    throw err
                }
                //console.log(`File uploaded successfully. ${data.Location}`)
            })
        })()
    }

    var sql = []

    //console.log('req.body.tipo=>' + req.body.tipo)

    if (req.body.tipo == 'documento') {
        sql = { documento: foto }
    }
    if (req.body.tipo == 'local') {
        sql = { local: foto }
    }
    if (req.body.tipo == 'entrada') {
        sql = { entrada: foto }
    }
    if (req.body.tipo == 'disjuntor') {
        sql = { disjuntor: foto }
    }
    if (req.body.tipo == 'trafo') {
        sql = { trafo: foto }
    }
    if (req.body.tipo == 'localizacao') {
        sql = { localizacao: foto }
    }
    if (req.body.tipo == 'telhado') {
        sql = { telhado_foto: foto }
    }
    if (req.body.tipo == 'medidor') {
        sql = { medidor: foto }
    }
    if (req.body.tipo == 'fatura') {
        sql = { fatura: foto }
    }
    if (req.body.tipo == 'tarefa') {
        Projeto.findOne({ _id: req.body.idprj }).then((prj) => {
            //console.log('prj.cliente=>'+prj.cliente)
            Cliente.findOne({ _id: prj.cliente }).then((cliente) => {
                //console.log("cliente.nome=>"+cliente.nome)
                //console.log("req.body.id=>"+req.body.id)
                Tarefas.findOneAndUpdate({ _id: req.body.id }, { $push: { fotos: foto } }).then((e) => {
                    Tarefas.findOneAndUpdate({ _id: req.body.id }, { $set: { datafim: dataHoje() } }).then((e) => {
                        req.flash('success_msg', 'Foto(s) da instalação salva(s) com sucesso.')
                        //console.log('req.body.idprj=>' + req.body.idprj)
                        Tarefas.find({ projeto: req.body.idprj }).then((lista_tarefas) => {
                            //console.log('lista_tarefas=>'+lista_tarefas)
                            lista_tarefas.forEach((e) => {
                                //console.log('e.fotos=>' + e.fotos)
                                if (naoVazio(e.fotos) == false) {
                                    notimg = false
                                }
                            })
                            //console.log('notimg=>' + notimg)
                            if (notimg == true) {
                                Acesso.find({ user: id, notimg: 'checked' }).then((acesso) => {
                                    //console.log('acesso=>' + acesso)
                                    if (naoVazio(acesso)) {
                                        acesso.forEach((e) => {
                                            Pessoa.findOne({ _id: e.pessoa }).then((pessoa) => {
                                                //console.log('pessoa=>' + pessoa)
                                                //console.log('enviou mensagem')
                                                texto = 'Olá ' + pessoa.nome + ',' + '\n' +
                                                    'Todas as fotos da obra do projeto ' + prj.seq + ' para o cliente ' + cliente.nome + '  estão na plataforma. ' +
                                                    'Acesse https://vimmus.com.br/gerenciamento/orcamento/' + prj._id + ' para verificar.'
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
                                                            res.redirect('/gerenciamento/mostrarFotos/tarefa@' + req.body.id + '@' + req.body.idprj)
                                                        }
                                                    }).done()

                                            }).catch((err) => {
                                                req.flash('error_msg', 'Houve um erro ao encontrar a pessoa<whats>.')
                                                res.redirect('/dashboard')
                                            })
                                        })
                                    } else {
                                        res.redirect('/gerenciamento/mostrarFotos/' + req.body.id + '@' + req.body.idprj)
                                    }
                                }).catch((err) => {
                                    req.flash('error_msg', 'Houve erro ao encontrar o acesso.')
                                    res.redirect('/gerenciamento/fotos/' + req.body.id)
                                })
                            } else {
                                //console.log('mostrar')
                                res.redirect('/gerenciamento/mostrarFotos/tarefa@' + req.body.id + '@' + req.body.idprj)
                            }
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve erro ao encontrar a tarefa.')
                            res.redirect('/dashboard')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve erro ao salvar as tarefas.')
                        res.redirect('/dashboard')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Houve erro ao salvar as tarefas.')
                    res.redirect('/dashboard')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Houve erro ao encontrar o cliente.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Houve erro ao encontrar o projeto.')
            res.redirect('/dashboard')
        })
    } else {
        //console.log('sql=>' + sql)
        Projeto.findOneAndUpdate({ _id: req.body.id }, { $push: sql }).then(() => {
            Projeto.findOne({ _id: req.body.id }).then((prj) => {
                var disjuntor
                var medidor
                var trafo
                if (req.body.tipo == 'disjuntor') {
                    //console.log('entrou disjuntor')
                    disjuntor = foto
                    medidor = prj.medidor
                    trafo = prj.trafo
                }
                if (req.body.tipo == 'medidor') {
                    medidor = foto
                    disjuntor = prj.disjuntor
                    trafo = prj.trafo
                }
                if (req.body.tipo == 'trafo') {
                    trafo = foto
                    disjuntor = prj.disjuntor
                    medidor = prj.medidor
                }

                //console.log('disjuntor=>' + disjuntor)
                //console.log('medidor=>' + medidor)
                //console.log('trafo=>' + trafo)

                if ((req.body.tipo == 'disjutor' || req.body.tipo == 'medidor' || req.body.tipo == 'trafo') &&
                    (naoVazio(disjuntor) && naoVazio(medidor) && naoVazio(trafo))) {
                    q = 0
                    //console.log('levantamento de rede')
                    Acesso.find({ user: id, notdoc: 'checked' }).then((acesso) => {
                        if (naoVazio(acesso)) {
                            acesso.forEach((e) => {
                                Pessoa.findOne({ _id: e.pessoa }).then((projetista) => {
                                    //console.log(pessoa.celular)
                                    mensagem = 'Olá ' + projetista.nome + ',' + '\n' +
                                        'O levantamento de rede da proposta ' + prj.seq + ' foi realizado.' + '\n' +
                                        'Acesse: https://quasat.vimmus.com.br/orcamento/' + prj._id + ' para mais informações.'
                                    client.messages
                                        .create({
                                            body: mensagem,
                                            from: 'whatsapp:+554991832978',
                                            to: 'whatsapp:+55' + projetista.celular
                                        })
                                        .then((message) => {
                                            //console.log(message.sid)
                                            q++
                                            if (q == acesso.length) {
                                                req.flash('success_msg', 'Levantamento de rede realizado com sucesso.')
                                                res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                            }
                                        }).done()
                                })
                            })
                        } else {
                            //console.log('aguardando')
                            req.flash('success_msg', 'Foto(s) adicionada(s) com sucesso.')
                            res.redirect('/gerenciamento/fotos/' + req.body.id)
                        }
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve erro ao salvar o acesso.')
                        res.redirect('/dashboard')
                    })
                } else {
                    //console.log('aguardando')
                    if (req.body.caminho = 'fatura') {
                        req.flash('success_msg', 'Fatura(s) adicionada(s) com sucesso.')
                        res.redirect('/gerenciamento/fatura/' + req.body.id)
                    } else {
                        req.flash('success_msg', 'Foto(s) adicionada(s) com sucesso.')
                        res.redirect('/gerenciamento/fotos/' + req.body.id)
                    }
                }
            }).catch((err) => {
                req.flash('error_msg', 'Houve erro ao salvar o projeto.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Houve erro ao salvar a fatura.')
            res.redirect('/dashboard')
        })
    }
});

router.get('/mostrarBucket/:docimg', ehAdmin, (req, res) => {
    //console.log("req.params.docimg=>" + req.params.docimg)
    s3.getObject(
        { Bucket: "quasatimg", Key: req.params.docimg },
        function (error, data) {
            if (error != null) {
                //console.log("Failed to retrieve an object: " + error);
            } else {
                //console.log(data.ContentLength)
                res.send(data.Body)
            }
        }
    )
});

module.exports = router;

