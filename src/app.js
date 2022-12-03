const express = require('express');
const app = express();

const cors = require('cors');

const mongoose = require('mongoose');

const { engine } = require('express-handlebars');
const path = require("path");

const session = require('express-session');
const filestore = require("session-file-store")(session);

const flash = require('connect-flash');

//const {verifyJWT} = require('./helpers/verificaJWT');

const administrador = require('./routes/administrador');
const agenda = require('./routes/agenda');
const assistenciaTecnica = require('./routes/assistenciaTecnica');
const atividadesPadrao = require('./routes/atividadesPadrao');
const cenario = require('./routes/cenario');
const cliente = require('./routes/cliente');
const componente = require('./routes/componente');
const configuracao = require('./routes/configuracao');
//const customdo = require('./routes/customdo');
const dashboard = require('./routes/dashboard');
const fornecedor = require('./routes/fornecedor');
const fotos = require('./routes/fotos');
const instalacao = require('./routes/instalacao');
const leads = require('./routes/leads');
const mensagensPadrao = require('./routes/mensagensPadrao');
const parametros = require('./routes/parametros');
const pedido = require('./routes/pedido');
const pessoa = require('./routes/pessoa');
const plano = require('./routes/plano');
const projetoEmAndamento = require('./routes/projetoEmAndamento');
const proposta = require('./routes/proposta');
const qualificacao = require('./routes/qualificacao');
const relatorios = require('./routes/relatorios');
const termos = require('./routes/termos');
const usuario = require('./routes/usuario');
const { use } = require('passport');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://quasatdb:64l10770@18.229.182.115/quasat?authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log(`DB conectado com sucesso.`)
}).catch((err) => {
    console.log(err);
});

app.use(cors());
app.use(session({
    name: "session-id",
    secret: "vimmus113022",
    saveUninitialized: false,
    resave: true,
    store: new filestore()
}));

//MIDDLEWARE - MENSAGENS FLASH
// app.use(flash())
// app.use((req, res, next) => {
//     res.locals.success_msg = req.flash('success_msg');
//     res.locals.error_msg = req.flash('error_msg');
//     res.locals.aviso_msg = req.flash('aviso_msg');
//     res.locals.error = req.flash("error");
//     res.locals.user = req.user || null;
//     next()
// })

//Handlebars
app.disable('x-powered-by')
app.engine('handlebars', engine({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

//CAMINHO ESTÁTICO
app.use(express.static('service/'));
app.use(express.static('public/'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'service')));

//ROTAS PRÁTICAS
app.get('/login', (req, res) => {
    res.render('usuario/login')
})
app.get('/politica', (req, res) => {
    res.render('politica')
})
app.get('/termo', (req, res) => {
    res.render('termo')
})


//Rotas
// app.use('/administrador', administrador);
// app.use('/agenda', agenda);
// app.use('/assistenciaTecnica', assistenciaTecnica);
// app.use('/atividadesPadrao', atividadesPadrao);
// app.use('/cenario', cenario);
// app.use('/cliente', cliente);
// app.use('/componente', componente);
// app.use('/configuracao', configuracao);
//app.use('/customdo', customdo);
// app.use('/dashboard', dashboard);
// app.use('/fornecedor', fornecedor);
// app.use('/fotos', fotos);
// app.use('/instalacao', instalacao);
// app.use('/leads', leads);
// app.use('/mensagensPadrao/', mensagensPadrao);
// app.use('/parametros/', parametros);
// app.use('/pedido/', pedido);
// app.use('/pessoa/', pessoa);
// app.use('/plano/', plano);
// app.use('/projetoEmAndamento/', projetoEmAndamento);
// app.use('/pessoa/', proposta);
// app.use('/qualificacao/', qualificacao);
// app.use('/relatorios/', relatorios);
// app.use('/termos/', termos);
// app.use('/usuario/', usuario);

const APP_PORT = process.env.APP_PORT || 3002

app.listen(APP_PORT, () => {
    console.log(`Running Site at port:${APP_PORT}`)
})