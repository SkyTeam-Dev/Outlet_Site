
/* ############## LOADING ############## */

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        let loader = document.getElementById("LoadingPage");
        if (loader) {
            loader.style.transition = "opacity 0.5s";
            loader.style.opacity = "0";

            setTimeout(() => {
                loader.style.display = "none";
                let site = document.getElementById("Site");
                if (site) {
                    site.style.display = "block";
                } else {
                    console.error("Elemento com ID 'Site' não encontrado.");
                }
            }, 500);
        } else {
            console.error("Elemento com ID 'LoadingPage' não encontrado.");
        }
    }, 2000);
});


/* ############## SLIDER ############## */

$(document).ready(function () {
    $('.SliderHome').slick({
        autoplay: true,
        fade: true,
        autoplaySpeed: 2000,
        infinite: true,
        dots: true,
        speed: 600,
        slidesToShow: 1,
        slidesToScroll: 1

    });
});


/* ################## BUSCA CNPJ COM VALIDAÇÃO E FALBACK ################## */

var cnpjErrorCache = {}; // Cache para CNPJ's com falha [[3]][[6]]
var debugLogs = []; // Armazenamento de logs de depuração [[8]]

// Função para registrar logs de depuração
function logDebug(message) {
    debugLogs.push(message);
    console.log("[DEBUG] " + message); // Log no console [[6]]
}

document.getElementById("cnpj").addEventListener("blur", function () {
    logDebug("Iniciando processo de consulta...");

    var cnpj = this.value.replace(/\D/g, ""); // Remove caracteres não numéricos [[5]]

    // Verifica cache de erros
    if (cnpjErrorCache[cnpj]) {
        logDebug("CNPJ " + cnpj + " já consta no cache de erros. Consulta abortada.");
        return;
    }

    // Validação básica do CNPJ
    if (!/^\d{14}$/.test(cnpj)) { // Regex para 14 dígitos [[7]]
        logDebug("CNPJ inválido detectado: " + cnpj);
        alert("CNPJ inválido. Verifique o formato e tente novamente.");
        return;
    }

    // Lista de APIs com fallback
    var apis = [
        {
            name: "BrasilAPI",
            url: "https://brasilapi.com.br/api/cnpj/v1/" + cnpj
        },
        {
            name: "InverTexto",
            url: "https://api.invertexto.com/v1/cnpj/" + cnpj + "?token=16473|OtgHBLImQHYqSJIIbFZy3FEeCWRADS4w"
        }
    ];

    // Seleção aleatória de API
    var selectedAPI = apis[Math.floor(Math.random() * apis.length)];
    logDebug("API selecionada: " + selectedAPI.name);

    // Configuração da requisição XMLHttpRequest [[11]]
    var xhr = new XMLHttpRequest();
    xhr.open("GET", selectedAPI.url, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) { // Requisição concluída [[9]]
            logDebug("Status da requisição: " + xhr.status);

            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    logDebug("Resposta da API recebida com sucesso");

                    // Limpa cache de erro
                    delete cnpjErrorCache[cnpj];

                    // Mapeamento condicional dos dados
                    var formMapper = {
                        razaoSocial: data.razao_social,
                        nomeFantasia: data.nome_fantasia,
                        logradouro: selectedAPI.name === "BrasilAPI" ? data.logradouro : (data.endereco && data.endereco.logradouro),
                        numero: selectedAPI.name === "BrasilAPI" ? data.numero : (data.endereco && data.endereco.numero),
                        bairro: selectedAPI.name === "BrasilAPI" ? data.bairro : (data.endereco && data.endereco.bairro),
                        cep: selectedAPI.name === "BrasilAPI" ? data.cep : (data.endereco && data.endereco.cep),
                        uf: selectedAPI.name === "BrasilAPI" ? data.uf : (data.endereco && data.endereco.uf),
                        municipio: selectedAPI.name === "BrasilAPI" ? data.municipio : (data.endereco && data.endereco.municipio)
                    };

                    // Preenchimento dos campos
                    for (var field in formMapper) {
                        if (formMapper.hasOwnProperty(field)) {
                            var input = document.getElementById(field);
                            if (input) input.value = formMapper[field] || "";
                        }
                    }
                } catch (e) {
                    logDebug("Erro ao processar resposta: " + e.message);
                    alert("Erro ao processar dados da API");
                }
            } else {
                try {
                    var error = JSON.parse(xhr.responseText);
                    error.apiName = selectedAPI.name;

                    // Registra CNPJ no cache de erros
                    cnpjErrorCache[cnpj] = true;

                    var errorMessage = "Erro na consulta via " + error.apiName + ": ";

                    if (error.apiName === "BrasilAPI" && error.errors) {
                        errorMessage += error.errors[0].message;
                        logDebug("Erro BrasilAPI: " + error.errors[0].message);
                    } else if (error.apiName === "InverTexto") {
                        errorMessage += error.message || "Erro desconhecido";
                        logDebug("Erro InverTexto: " + error.message);
                    }

                    alert(errorMessage);
                } catch (e) {
                    logDebug("Falha na comunicação com a API");
                    alert("Falha na comunicação com a API");
                }
            }
        }
    };

    // Tratamento de erros de rede [[12]]
    xhr.onerror = function () {
        logDebug("Erro de rede ao consultar " + selectedAPI.name);
        cnpjErrorCache[cnpj] = true;
        alert("Erro de rede ao consultar " + selectedAPI.name);
    };

    xhr.send();
});



/* ################## BUSCA CEP ################## */

function limpa_formulário_cep() {
    //Limpa valores do formulário de cep.
    document.getElementById('rua').value = ("");
    document.getElementById('bairro').value = ("");
    document.getElementById('cidade').value = ("");
    document.getElementById('uf').value = ("");
    document.getElementById('ibge').value = ("");
}

function meu_callback(conteudo) {
    if (!("erro" in conteudo)) {
        //Atualiza os campos com os valores.
        document.getElementById('rua').value = (conteudo.logradouro);
        document.getElementById('bairro').value = (conteudo.bairro);
        document.getElementById('cidade').value = (conteudo.localidade);
        document.getElementById('uf').value = (conteudo.uf);
        document.getElementById('ibge').value = (conteudo.ibge);
    } //end if.
    else {
        //CEP não Encontrado.
        limpa_formulário_cep();
        alert("CEP não encontrado.");
    }
}

function pesquisacep(valor) {

    //Nova variável "cep" somente com dígitos.
    var cep = valor.replace(/\D/g, '');

    //Verifica se campo cep possui valor informado.
    if (cep != "") {

        //Expressão regular para validar o CEP.
        var validacep = /^[0-9]{8}$/;

        //Valida o formato do CEP.
        if (validacep.test(cep)) {

            //Preenche os campos com "..." enquanto consulta webservice.
            document.getElementById('rua').value = "...";
            document.getElementById('bairro').value = "...";
            document.getElementById('cidade').value = "...";
            document.getElementById('uf').value = "...";
            document.getElementById('ibge').value = "...";

            //Cria um elemento javascript.
            var script = document.createElement('script');

            //Sincroniza com o callback.
            script.src = 'https://viacep.com.br/ws/' + cep + '/json/?callback=meu_callback';

            //Insere script no documento e carrega o conteúdo.
            document.body.appendChild(script);

        } //end if.
        else {
            //cep é inválido.
            limpa_formulário_cep();
            alert("Formato de CEP inválido.");
        }
    } //end if.
    else {
        //cep sem valor, limpa formulário.
        limpa_formulário_cep();
    }
};