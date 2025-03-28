
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

document.getElementById('cnpj').addEventListener('blur', function() {
    const cnpj = this.value.replace(/\D/g, ''); 
    // Remove caracteres não numéricos [[5]]
    
    // Validação básica do CNPJ (14 dígitos)
    if (!/^\d{14}$/.test(cnpj)) {
        alert('CNPJ inválido. Verifique o formato e tente novamente.');
        return;
    }

    // Escolha aleatória da API [[3]]
    const apis = [
        { 
            name: 'BrasilAPI', 
            url: `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`
        },
        { 
            name: 'InverTexto', 
            url: `https://api.invertexto.com/v1/cnpj/${cnpj}?token=SEU_TOKEN_AQUI`
        }
    ];
    const selectedAPI = apis[Math.floor(Math.random() * apis.length)];

    fetch(selectedAPI.url)
        .then(response => {
            if (response.ok) return response.json();
            return response.json().then(err => { throw err; });
        })
        .then(data => {
            // Mapeamento dinâmico dos dados [[6]]
            const formMapper = {
                'razaoSocial': data.razao_social,
                'nomeFantasia': data.nome_fantasia,
                'logradouro': selectedAPI.name === 'BrasilAPI' ? data.logradouro : data.endereco.logradouro,
                'numero': selectedAPI.name === 'BrasilAPI' ? data.numero : data.endereco.numero,
                'bairro': selectedAPI.name === 'BrasilAPI' ? data.bairro : data.endereco.bairro,
                'cep': selectedAPI.name === 'BrasilAPI' ? data.cep : data.endereco.cep,
                'uf': selectedAPI.name === 'BrasilAPI' ? data.uf : data.endereco.uf,
                'municipio': selectedAPI.name === 'BrasilAPI' ? data.municipio : data.endereco.municipio
            };

            // Preenchimento dos campos [[1]]
            Object.keys(formMapper).forEach(field => {
                const input = document.getElementById(field);
                if (input) input.value = formMapper[field] || '';
            });
        })
        .catch(error => {
            let errorMessage = "Erro na consulta via ${selectedAPI.name}: ";
            // Tratamento de erros específico [[4]]
            if (selectedAPI.name === 'BrasilAPI' && error.errors) {
                errorMessage += error.errors[0].message;
            } else if (selectedAPI.name === 'InverTexto') {
                errorMessage += error.message || 'Erro desconhecido';
            }

            alert(errorMessage);
        });
});


/* ############## BUSCA CEP ############## */

function consultarCNPJ(cnpj, index = 0) {
    if (index >= apiEndpoints.length) {
        alert('Nenhuma FORNECEDOR retornou dados válidos.');
        return;
    }

    const api = apiEndpoints[index];
    const url = buildApiUrl(api, cnpj);

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status} na API ${api.name}`);
            }
            return response.json();
        })
        .then(data => {
            if (!api.validate(data)) {
                throw new Error(`Dados inválidos no FORNECEDOR ${api.name}`);
            }

            console.log(`Dados retornados da API ${api.name}`);
            preencherFormulario(api.mapping(data));
        })
        .catch(error => {
            console.error(`Erro na API ${api.name}: ${error.message}`);
            consultarCNPJ(cnpj, index + 1); // Tenta a próxima API
        });
}

function preencherFormulario(data) {
    document.getElementById('razaoSocial').value = data.razaoSocial || '';
    document.getElementById('nomeFantasia').value = data.nomeFantasia || '';
    document.getElementById('dataInicio').value = data.dataInicio || '';
    document.getElementById('telefone1').value = data.telefone1 || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('capitalSocial').value = data.capitalSocial || '';
    document.getElementById('situacao').value = data.situacao || '';
    document.getElementById('logradouro').value = data.logradouro || '';
    document.getElementById('numero').value = data.numero || '';
    document.getElementById('complemento').value = data.complemento || '';
    document.getElementById('bairro').value = data.bairro || '';
    document.getElementById('municipio').value = data.municipio || '';
    document.getElementById('uf').value = data.uf || '';
    document.getElementById('cep').value = data.cep || '';
    document.getElementById('simples').value = data.simples || '';
    document.getElementById('mei').value = data.mei || '';
    document.getElementById('atividadePrincipal').value = data.atividadePrincipal || '';
    document.getElementById('atividadesSecundarias').value = data.atividadesSecundarias || '';
    document.getElementById('socios').value = data.socios || '';
}





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