<h1 style="font-size:32px;">robot.tw2</h1>
<hr>
<h5>Script de automação para TW2</h5>
<blockquote>
  <p>
    <b>Faça o download da extensão aqui</b>
    <ul>
        <li><a href="https://github.com/MendelssohnTW/robot.tw2/raw/master/extension/app/app.zip">latest</a></li>
    </ul>
  </p>
</blockquote>
<hr>
  <p>
    <br> Após o download extraia os arquivos em local reservado.
    <br> Abra o navegador <b style="color:blue;">Chrome/Opera/Chromium</b> e digite na barra de endereço <b>chrome://extensions/</b>.
    <br> A extensão também é compatível com os navegadores <b style="color:blue;">Tor/Microsoft Edge</b>.
    <br> Selecione <b style="color:blue;">Modo de desenvolvedor</b>, após faça o carregamento de extensão sem compactação selecionando a pasta à partir do local de extração.
    <br> Ao carregar a extensão reinicie seu navegador.
    <br> Para acessar use as teclas <b style="color:blue;">shift + p</b> para menu principal.
  </p>
<hr>

<h2 id="introdution">Introdução ao FARM</h2>
<blockquote>
<p>
Farm é o sistema de coleta de recursos automatizados com envio de comandos programados e automáticos.
</p>
</blockquote>

<h2 id="functions">Funções do FARM</h2>

<ul>
    <li>Ciclos de FARM por tempo determinado ou indeterminado com início, fim e ou sem fim.</li>
    <li>Tempo de ciclos definidos.</li>
    <li>Comandos de FARM baseado em predefinições</li>
    <li>Configuração de busca por aldeias através de pontuações mínimas ou máximas</li>
    <li>Configuração de busca por aldeias através de distância mínima ou máxima</li>
    <li>Configuração de busca por aldeias de maior distância para a de menor distância ou vice-versa</li>
    <li>Configuração de envio de unidades de tropas com maior velocidade para a de menor velocidade ou vice-versa</li>
    <li>Área de buscas divididas em quatro quadrantes que podem ser escolhidos</li>
    <li>Limitação de comandos para cada predefinição</li>
    <li>Ativação e desativação do FARM por aldeias</li>
    <li>Ativação e desativação do FARM em aldeias sob ataques</li>
    <li>Ativação e desativação do FARM em aldeias com agendas de ataques ou defesas dos respectivos módulos</li>
    <li>Criação de predefinições padrões possibilitando escolha de nome e quantidade de unidade de tropa</li>
    <li>Adição e remoção de predefinições por aldeias ou em todas as aldeias</li>
    <li>Inclusão automática na lista de exclusão de relatórios com casualidades do FARM, com possibilidade de exclusão</li>
    <li>Pausa do sistema FARM durante execução da agenda dos módulos de ATAQUE e DEFESA</li>
    <li>Log de acomapanhamento</li>
</ul>

<h2 id="operation">Funcionamento do FARM</h2>
<blockquote>
    <br>Para acesso a tela de FARM pode-se usar as teclas de atalho <b style="color:blue;">shift + P</b> pela tela principal de módulos.
    <br>O sistema faz uma varredura no mapa conforme configurações e envia os comandos de unidades de acordo com as predefinições da aldeia. 
    <br>Os ciclos são executados conforme o tempo definido, podendo executar mais de um ciclo paralelamente. 
    <br>Os comandos são enviados em intervalos aleatórios calculados entre 1,5 a 2,5 segundos.
    <br>O tempo de duração de cada ciclo depende da quantidade de comandos pela quantidade de aldeias.
    <br>Durante a execução do ciclo, este pode ser pausado por até 1 minuto e 5 segundos para o módulo de DEFESA e 35 segundos para o módulo de ATAQUE, evitando o congestionamento de solicitações de conexão e precisando o envio da agenda dos módulos.
    <br>O sistema por padrão inicia automáticamente no carregamento da página. Podendo ser configurado para inicio manual, ou desativado.
    <br>Em primeira instância o sistema irá executar havendo qualquer predefinição já configurada para as aldeias.
    <br>Durante execução do FARM, este pode ser parado a qualquer momento e novamente iniciado.
    <br>As predefinições com quantidades inferior a 5 em unidades não serão executadas assim como executará somente as predefinições que incluem as unidades básicas de defesa e ataques (lanceiros, espadachins, arqueiros, vikings, cavalarias). As demais unidades de cerco e outras se incluídas nas predefinições automaticamente excluem tal predefinição da execução. 
</blockquote>
