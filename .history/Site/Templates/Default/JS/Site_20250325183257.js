
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


/* ############## BUSCA RECEITA ############## */

// Função auxiliar para remover formatação do CNPJ
function limparCNPJ(cnpj) {
    return cnpj.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
}

// Função auxiliar para construir a URL, considerando o token se houver
function buildApiUrl(api, cnpj) {
    let url = api.url + cnpj;
    if (api.token) {
        url += '?token=' + encodeURIComponent(api.token);
    }
    return url;
}

// Verifica o tamanho do CNPJ e dispara a consulta
document.getElementById('CNPJ_Busca').addEventListener('input', function () {
    let cnpj = this.value;

    if (cnpj.length === 18) {
        cnpj = limparCNPJ(cnpj); // Remove formatação e mantém apenas números
    }

    if (cnpj.length < 14) {
        alert('O CNPJ inserido tem menos de 14 caracteres numéricos.');
        return;
    }

    if (cnpj.length > 14) {
        alert('O CNPJ inserido tem mais de 14 caracteres numéricos. Verifique se está correto.');
        return;
    }

    // Se chegou até aqui, o CNPJ está com 14 números e pode ser consultado
    consultarCNPJ(cnpj);
});

// Lista de APIs para consulta do CNPJ
const apiEndpoints = [
    {
        name: 'Receitaws',
        url: 'https://receitaws.com.br/v1/cnpj/',
        mapping: function (data) {
            return {
                razaoSocial: data.nome,
                nomeFantasia: data.fantasia,
                dataInicio: data.abertura,
                telefone1: data.telefone,
                email: data.email,
                capitalSocial: data.capital_social,
                situacao: data.situacao,
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                municipio: data.municipio,
                uf: data.uf,
                cep: data.cep,
                simples: data.simples && data.simples.optante ? 'Sim' : 'Não',
                mei: data.simei && data.simei.optante ? 'Sim' : 'Não',
                atividadePrincipal: data.atividade_principal?.[0]?.code + ' - ' + data.atividade_principal?.[0]?.text || '',
                atividadesSecundarias: data.atividades_secundarias?.map(item => item.code + ' - ' + item.text).join(', ') || '',
                socios: data.qsa?.map(item => item.nome + ' (' + item.cnpj_cpf_do_socio + ')').join(', ') || 'Não informado'
            };
        },
        validate: function (data) {
            return data.status === "OK";
        }
    },
    {
        name: 'MinhaReceita',
        url: 'https://minhareceita.org/',
        mapping: function (data) {
            return {
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia,
                dataInicio: data.data_situacao_cadastral || '',
                telefone1: data.ddd_telefone_1 || '',
                email: data.email || '',
                capitalSocial: data.capital_social,
                situacao: data.situacao_cadastral ? data.descricao_situacao_cadastral : '',
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                municipio: data.municipio,
                uf: data.uf,
                cep: data.cep,
                simples: data.opcao_pelo_simples ? 'Sim' : 'Não',
                mei: data.opcao_pelo_mei ? 'Sim' : 'Não',
                atividadePrincipal: data.cnae_fiscal ? data.cnae_fiscal.toString() : '',
                atividadesSecundarias: (data.cnaes_secundarios && data.cnaes_secundarios.length)
                    ? data.cnaes_secundarios.map(item => item.codigo + ' - ' + item.descricao).join(', ')
                    : '',
                socios: (data.qsa && data.qsa.length)
                    ? data.qsa.map(item => item.nome_socio + ' (' + item.cnpj_cpf_do_socio + ')').join(', ')
                    : 'Não informado'
            };
        },
        validate: function (data) {
            return data.razao_social !== undefined;
        }
    },
    {
        name: 'BrasilAPI',
        url: 'https://brasilapi.com.br/api/cnpj/v1/',
        mapping: function (data) {
            return {
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia,
                dataInicio: data.data_inicio_atividade,
                telefone1: data.ddd_telefone_1,
                email: data.email,
                capitalSocial: data.capital_social,
                situacao: data.descricao_situacao_cadastral,
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                municipio: data.municipio,
                uf: data.uf,
                cep: data.cep,
                simples: data.opcao_pelo_simples ? 'Sim' : 'Não',
                mei: data.opcao_pelo_mei ? 'Sim' : 'Não',
                atividadePrincipal: data.cnae_fiscal ? data.cnae_fiscal + ' - ' + data.cnae_fiscal_descricao : '',
                atividadesSecundarias: data.cnaes_secundarios?.map(item => item.codigo + ' - ' + item.descricao).join(', ') || '',
                socios: data.qsa?.map(item => item.nome_socio + ' (' + item.cnpj_cpf_do_socio + ')').join(', ') || 'Não informado'
            };
        },
        validate: function (data) {
            return data.razao_social !== undefined;
        }
    },
    {
        name: 'Invertexto',
        url: 'https://api.invertexto.com/v1/cnpj/',
        token: '16473|OtgHBLImQHYqSJIIbFZy3FEeCWRADS4w',
        mapping: function (data) {
            return {
                razaoSocial: data.razao_social,
                nomeFantasia: data.nome_fantasia,
                dataInicio: data.data_inicio,
                telefone1: data.telefone1,
                email: data.email,
                capitalSocial: data.capital_social,
                situacao: data.situacao?.nome || '',
                logradouro: data.endereco?.logradouro || '',
                numero: data.endereco?.numero || '',
                complemento: data.endereco?.complemento || '',
                bairro: data.endereco?.bairro || '',
                municipio: data.endereco?.municipio || '',
                uf: data.endereco?.uf || '',
                cep: data.endereco?.cep || '',
                simples: data.simples?.optante_simples === "S" ? 'Sim' : 'Não',
                mei: data.mei?.optante_mei === "S" ? 'Sim' : 'Não',
                atividadePrincipal: data.atividade_principal?.codigo + ' - ' + data.atividade_principal?.descricao || '',
                atividadesSecundarias: data.atividades_secundarias?.map(item => item.codigo + ' - ' + item.descricao).join(', ') || '',
                socios: data.socios?.map(item => item.nome + ' (' + item.cpf_cnpj + ')').join(', ') || 'Não informado'
            };
        },
        name: 'CNPJA',
        url: 'https://cnpja.com/api/open/',
        mapping: function (data) {
            const company = data.company || {};
            return {
                razaoSocial: company.name || '',
                nomeFantasia: company.name || '',
                dataInicio: data.founded || '',
                telefone1: (data.phones && data.phones.length) ? data.phones[0].area + ' ' + data.phones[0].number : '',
                email: (data.emails && data.emails.length) ? data.emails[0].address : '',
                capitalSocial: company.equity || '',
                situacao: data.status && data.status.text ? data.status.text : '',
                logradouro: '',
                numero: '',
                complemento: '',
                bairro: '',
                municipio: '',
                uf: '',
                cep: '',
                simples: (company.simples && company.simples.optant) ? 'Sim' : 'Não',
                mei: (company.simei && company.simei.optant) ? 'Sim' : 'Não',
                atividadePrincipal: data.mainActivity
                    ? data.mainActivity.id + ' - ' + data.mainActivity.text
                    : '',
                atividadesSecundarias: (data.sideActivities && data.sideActivities.length)
                    ? data.sideActivities.map(item => item.id + ' - ' + item.text).join(', ')
                    : '',
                socios: (company.members && company.members.length)
                    ? company.members.map(item => item.person.name + ' (' + item.person.taxId + ')').join(', ')
                    : 'Não informado'
            };
        },
        validate: function (data) {
            return data.razao_social !== undefined;
        }
    }
];

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