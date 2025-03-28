
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

    if (cnpjErrorCache[cnpj]) {
        logDebug("CNPJ " + cnpj + " já consta no cache de erros. Consulta abortada.");
        return;
    }

    if (!/^\d{14}$/.test(cnpj)) {
        logDebug("CNPJ inválido detectado: " + cnpj);
        alert("CNPJ inválido. Verifique o formato.");
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

        var formMapper = {};

        // Mapeamento para cada API com base na documentação:
        if (selectedAPI.name === "BrasilAPI") {
            // BrasilAPI: observe que os dados extras vêm de campos como "qsa", "cnaes_secundarios" e "cnae_fiscal_descricao"
            formMapper = {
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia,
                situacao_cadastral: data.descricao_situacao_cadastral,
                simples_nacional: data.opcao_pelo_simples,
                mei: data.opcao_pelo_mei,
                socios: data.qsa || [],
                atividade_principal: data.cnae_fiscal_descricao || "",
                atividades_secundarias: data.cnaes_secundarios || []
            };
        } else if (selectedAPI.name === "CNPJs.dev") {
            // CNPJs.dev: a resposta possui os campos "socios", "cnae_fiscal_principal" e "cnae_fiscal_secundaria"
            formMapper = {
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia,
                situacao_cadastral: data.situacao_cadastral,
                simples_nacional: false, // A API não retorna esse campo; você pode definir conforme sua lógica
                mei: false,            // idem
                socios: data.socios || [],
                atividade_principal: data.cnae_fiscal_principal ? data.cnae_fiscal_principal.nome : "",
                atividades_secundarias: data.cnae_fiscal_secundaria || []
            };
        } else if (selectedAPI.name === "InverTexto") {
            // InverTexto: os dados extras estão dentro de "socios", "atividade_principal" e "atividades_secundarias"
            formMapper = {
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia,
                situacao_cadastral: data.situacao ? data.situacao.nome : "",
                simples_nacional: (data.simples && data.simples.optante_simples === "S") ? true : false,
                mei: (data.mei && data.mei.optante_mei === "S") ? true : false,
                socios: data.socios || [],
                atividade_principal: data.atividade_principal ? data.atividade_principal.descricao : "",
                atividades_secundarias: data.atividades_secundarias || []
            };
        }

        // Preenche os inputs correspondentes (ids: razaoSocial, nomeFantasia, logradouro, numero, bairro, cep, uf, municipio)
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