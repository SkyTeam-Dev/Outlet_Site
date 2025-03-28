
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

var cnpjErrorCache = {};
var debugLogs = [];

function logDebug(message) {
    debugLogs.push(message);
    console.log("[DEBUG] " + message);
}

function formatarCNPJ(cnpj) {
    if (typeof cnpj !== 'string') {
        cnpj = String(cnpj); // Corrige erro replace [[5]][[6]]
    }
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

document.getElementById("cnpj").addEventListener("blur", function () {
    logDebug("Iniciando processo de consulta...");

    var cnpj = this.value.replace(/\D/g, "");

    if (cnpjErrorCache[cnpj]) {
        logDebug("CNPJ " + cnpj + " já consta no cache de erros. Consulta abortada.");
        return;
    }

    if (!/^\d{14}$/.test(cnpj)) {
        logDebug("CNPJ inválido detectado: " + cnpj);
        alert("CNPJ inválido. Verifique o formato.");
        return;
    }

    var apis = [
        {
            name: "BrasilAPI",
            url: "https://brasilapi.com.br/api/cnpj/v1/" + cnpj
        },
        {
            name: "InverTexto",
            url: "https://api.invertexto.com/v1/cnpj/" + cnpj + "?token=16473|OtgHBLImQHYqSJIIbFZy3FEeCWRADS4w"
        },
        {
            name: "CNPJs.dev",
            url: "https://api.cnpjs.dev/v1/" + cnpj
        }
    ];

    apis.sort(() => Math.random() - 0.5);
    logDebug("Ordem de tentativa: " + apis.map(api => api.name).join(" → "));

    function tryNextAPI(index) {
        if (index >= apis.length) {
            logDebug("Todas as APIs falharam");
            cnpjErrorCache[cnpj] = true;
            alert("Falha em todas as tentativas. CNPJ bloqueado temporariamente.");
            return;
        }

        setTimeout(() => { // Delay entre tentativas [[4]]
            var selectedAPI = apis[index];
            logDebug("Tentando API: " + selectedAPI.name + " (" + (index + 1) + "/" + apis.length + ")");

            var xhr = new XMLHttpRequest();
            xhr.open("GET", selectedAPI.url, true);
            xhr.setRequestHeader('Content-Type', 'application/json'); // Adiciona header [[1]]

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    logDebug("Status da requisição: " + xhr.status);

                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            logDebug("Resposta da API recebida com sucesso");

                            delete cnpjErrorCache[cnpj];

                            var formMapper = {
                                razaoSocial: data.razao_social,
                                nomeFantasia: data.nome_fantasia,
                                logradouro: selectedAPI.name === "CNPJs.dev" ?
                                    (data.endereco.tipo_logradouro + " " + data.endereco.logradouro) :
                                    (selectedAPI.name === "BrasilAPI" ? data.logradouro : (data.endereco && data.endereco.logradouro)),
                                numero: selectedAPI.name === "CNPJs.dev" ? data.endereco.numero :
                                    (selectedAPI.name === "BrasilAPI" ? data.numero : (data.endereco && data.endereco.numero)),
                                bairro: selectedAPI.name === "CNPJs.dev" ? data.endereco.bairro :
                                    (selectedAPI.name === "BrasilAPI" ? data.bairro : (data.endereco && data.endereco.bairro)),
                                cep: selectedAPI.name === "CNPJs.dev" ? data.endereco.cep :
                                    (selectedAPI.name === "BrasilAPI" ? data.cep : (data.endereco && data.endereco.cep)),
                                uf: selectedAPI.name === "CNPJs.dev" ? data.endereco.uf :
                                    (selectedAPI.name === "BrasilAPI" ? data.uf : (data.endereco && data.endereco.uf)),
                                municipio: selectedAPI.name === "CNPJs.dev" ? data.endereco.municipio :
                                    (selectedAPI.name === "BrasilAPI" ? data.municipio : (data.endereco && data.endereco.municipio))
                            };

                            for (var field in formMapper) {
                                if (formMapper.hasOwnProperty(field)) {
                                    var input = document.getElementById(field);
                                    if (input) input.value = formMapper[field] || "";
                                }
                            }
                        } catch (e) {
                            logDebug("Erro ao processar resposta: " + e.message);
                            tryNextAPI(index + 1);
                        }
                    } else {
                        tryNextAPI(index + 1);
                    }
                }
            };

            xhr.onerror = function () {
                logDebug("Erro de rede ou bloqueio CORS detectado");
                tryNextAPI(index + 1);
            };

            xhr.send();
        }, index * 2000); // Atraso crescente de 1s, 2s, 3s...
    }

    tryNextAPI(0);
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