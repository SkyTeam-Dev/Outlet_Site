
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
        cnpj = String(cnpj); // Converte para string
    }
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

document.getElementById("cnpj").addEventListener("blur", function () {
    logDebug("Iniciando processo de consulta...");

    var cnpj = this.value.replace(/\D/g, "");
    var loadingIndicator = document.getElementById("cnpj-loading");

    // Exibe o indicador de carregamento
    loadingIndicator.style.display = "inline-block";

    if (cnpjErrorCache[cnpj]) {
        logDebug("CNPJ " + cnpj + " já consta no cache de erros. Consulta abortada.");
        loadingIndicator.style.display = "none";
        return;
    }

    if (!/^\d{14}$/.test(cnpj)) {
        logDebug("CNPJ inválido detectado: " + cnpj);
        alert("CNPJ inválido. Verifique o formato.");
        loadingIndicator.style.display = "none";
        return;
    }

    // Definição das APIs com suas respectivas URLs
    var apis = [
        {
            name: "BrasilAPI",
            url: "https://brasilapi.com.br/api/cnpj/v1/" + cnpj
            // Caso persista problema de CORS, considere utilizar um proxy (ex.: window.location.origin + "/proxy.php?cnpj=" + cnpj)
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

    // Embaralha a ordem das APIs para tentativas aleatórias
    apis.sort(() => Math.random() - 0.5);
    logDebug("Ordem de tentativa: " + apis.map(api => api.name).join(" → "));

    // Função que processa a resposta de acordo com a API utilizada
    function processarResposta(data, selectedAPI) {
        logDebug("Resposta da API " + selectedAPI.name + " recebida com sucesso");
        delete cnpjErrorCache[cnpj];

        // Oculta o indicador de carregamento assim que a resposta é processada
        loadingIndicator.style.display = "none";

        var formMapper = {};

        // Mapeamento para cada API com base na documentação:
        if (selectedAPI.name === "BrasilAPI") {
            formMapper = {
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia || "",
                situacao_cadastral: data.descricao_situacao_cadastral,
                simples_nacional: data.opcao_pelo_simples,
                mei: data.opcao_pelo_mei,
                cep_API: data.cep
            };
            console.table(data);
        } else if (selectedAPI.name === "CNPJs.dev") {
            formMapper = {
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia || "",
                situacao_cadastral: data.situacao_cadastral,
                simples_nacional: false, // Não informado na API; defina conforme sua lógica
                mei: false,
                cep_API: data.endereco && data.endereco.cep ? data.endereco.cep : ""
            };
            console.table(data);
        } else if (selectedAPI.name === "InverTexto") {
            formMapper = {
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia || "",
                situacao_cadastral: data.situacao,
                simples_nacional: (data.simples && data.simples.optante_simples === "S") ? true : false,
                mei: (data.mei && data.mei.optante_mei === "S") ? true : false,
                cep_API: data.endereco ? data.endereco.cep : ""
            };
            console.table(data);
        }

        // Preenche os inputs correspondentes (certifique-se de que os elementos com os ids existem no HTML)
        for (var field in formMapper) {
            if (formMapper.hasOwnProperty(field)) {
                var input = document.getElementById(field);
                if (input) input.value = formMapper[field] || "";
            }
        }
    }

    // Função que tenta cada API em sequência com delay entre tentativas
    function tryNextAPI(index) {
        if (index >= apis.length) {
            logDebug("Todas as APIs falharam");
            cnpjErrorCache[cnpj] = true;
            alert("Falha em todas as tentativas. CNPJ bloqueado temporariamente.");
            loadingIndicator.style.display = "none";
            return;
        }

        // Delay crescente entre as tentativas (2.5s, 5s, 7.5s, etc.)
        setTimeout(() => {
            var selectedAPI = apis[index];
            logDebug("Tentando API: " + selectedAPI.name + " (" + (index + 1) + "/" + apis.length + ")");

            fetch(selectedAPI.url, {
                method: "GET",
                headers: {
                    // Cabeçalhos necessários, sem o 'X-Requested-With'
                    "User-Agent": "Ws4SkyTeam/1.0 (+ " + window.location.origin + ")",
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            })
                .then(response => {
                    logDebug("Status da resposta: " + response.status);
                    if (!response.ok) throw new Error("Erro na API");
                    return response.json();
                })
                .then(data => {
                    processarResposta(data, selectedAPI);
                })
                .catch(error => {
                    logDebug("Erro na API " + selectedAPI.name + ": " + error.message);
                    tryNextAPI(index + 1);
                });
        }, index * 2500);
    }

    tryNextAPI(0);
});


/* ################## BUSCA CEP ################## */

function limpa_formulário_cep() {
    console.log("Limpando formulário de CEP.");
    document.getElementById('endereco_API').value = "";
    document.getElementById('bairro_API').value = "";
    document.getElementById('cidade_API').value = "";
    document.getElementById('uf_API').value = "";
    document.getElementById('ibge_API').value = "";
    document.getElementById('complemento_API').value = conteudo.complemento || "";
}

function meu_callback(conteudo) {
    console.log("Recebendo resposta da API.", conteudo);
    // Oculta o indicador de carregamento ao receber a resposta
    document.getElementById("cep-loading").style.display = "none";

    if (!("erro" in conteudo)) {
        console.log("CEP encontrado. Atualizando campos do formulário.");
        document.getElementById('endereco_API').value = conteudo.logradouro || "";
        document.getElementById('bairro_API').value = conteudo.bairro || "";
        document.getElementById('cidade_API').value = conteudo.localidade || "";
        document.getElementById('uf_API').value = conteudo.uf || "";
        document.getElementById('ibge_API').value = conteudo.ibge || "";
        document.getElementById('cep_API').value = conteudo.cep || "";
        document.getElementById('complemento_API').value = conteudo.complemento || "";
    } else {
        console.error("CEP não encontrado.");
        limpa_formulário_cep();
        alert("CEP não encontrado.");
    }
}

function pesquisacep(valor) {
    // Exibe o indicador de carregamento
    document.getElementById("cep-loading").style.display = "inline-block";
    console.log("Iniciando pesquisa de CEP: ", valor);

    var cep = valor.replace(/\D/g, '');
    console.log("CEP formatado (apenas números): ", cep);

    if (cep != "") {
        var validacep = /^[0-9]{8}$/;

        if (validacep.test(cep)) {
            console.log("CEP válido. Iniciando consulta na API.");
            document.getElementById('endereco_API').value = "...";
            document.getElementById('bairro_API').value = "...";
            document.getElementById('cidade_API').value = "...";
            document.getElementById('uf_API').value = "...";
            document.getElementById('ibge_API').value = "...";
            document.getElementById('complemento_API').value = "...";

            var script = document.createElement('script');
            script.src = 'https://viacep.com.br/ws/' + cep + '/json/?callback=meu_callback';
            console.log("Inserindo script no documento: ", script.src);
            document.body.appendChild(script);
        } else {
            console.error("Formato de CEP inválido.");
            limpa_formulário_cep();
            alert("Formato de CEP inválido.");
            document.getElementById("cep-loading").style.display = "none";
        }
    } else {
        console.warn("Campo CEP vazio. Limpando formulário.");
        limpa_formulário_cep();
        document.getElementById("cep-loading").style.display = "none";
    }
}


/* ################## input mask ################## */

$(document).ready(function(){

    $('#nascimento').mask('00/00/0000');
    $('#cep').mask('00000-000');
    $('#cep_API').mask('00000-000');
    $('#cpf').mask('000.000.000-00', {reverse: true});
    $('#cnpj').mask('00.000.000/0000-00', {reverse: true});


});