const api = axios.create({
    baseURL: baseURL
});

const createSession = async (user, password) => {
    return api.post('/sessions', {
        user, password
    });
};

async function handleRequest(e) {
    await axios.post(`${baseURL}/sessions`, {
        user: document.getElementById('user'),
        password: document.getElementById('password'),
    }).then(function (res) {
        console.log(res);
    });
};

window.onsubmit = async function (e) {
    e.preventDefault();

    var user = $('#user').val();
    var password = $('#password').val();

    await axios.post(`${baseURL}/login/authenticate`, {
        user, password
    })
    .then(function (res) {
        console.log('retorno positivo: ' + JSON.stringify(res.data));
        localStorage.setItem("user",res.data.user);
    }).catch(function (err) {
        console.log('Retorno do erro: ' + err);
    });
}
