var setData = function(date,add) {
    var ano = date.substring(0, 4)
    var mes = date.substring(5, 7)
    var dia = date.substring(8, 11)
    var data = new Date(ano, mes, dia)
    //console.log('dif=>'+dif)

    data.setDate(data.getDate() + parseFloat(add))
    ano = data.getFullYear()
    mes = data.getMonth()
    if (parseFloat(mes) < 10){
        mes = '0' + mes
    }
    d = data.getDate()

    if (parseFloat(d) < 10){
        d = '0' + d
    }
    else
        d = String(d);
    
    if (d == '30' && mes == '02'){
        d = '01'
        mes = '03'
    }     
    if (d == '31' && mes == '04'){
        d = '01'
        mes = '05'
    }    
    if (d == '31' && mes == '06'){
        d = '01'
        mes = '07'
    } 
    if (d == '31' && mes == '09'){
        d = '01'
        mes = '10'
    }          
    if (d == '31' && mes == '11') {
        d = '01'
        mes = '12'
    }        
    data = ano+'-'+mes+'-'+d

    return data
}

module.exports = setData
