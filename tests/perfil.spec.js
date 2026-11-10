const { test, expect } = require('@playwright/test');
const fs = require('fs');

async function abrirPerfil(page) {
    await page.evaluate(() => {
        showSection('perfil');
        pTab = 'id';
        renderPTabs();
        renderForm();
    });
}

test.beforeEach(async ({ page }) => {
    await page.goto('/?teste=' + Date.now());
    await page.waitForFunction(() => typeof profile !== 'undefined' && typeof showSection === 'function');
});

test('perfil, privacidade e prévia pública', async ({ page }) => {
    await abrirPerfil(page);
    await page.evaluate(() => {
        profile.nick = 'Teste Automático';
        profile.bio = 'Bio de teste';
        profile.links.discord = 'teste#1234';
        profile.privacy = { ...profile.privacy, level: false, links: false };
        saveProfile();
        applyProfile();
        renderProfileView();
        renderSideCard();
    });

    await expect(page.locator('#pvId')).toContainText('Teste Automático');
    await expect(page.locator('#pvId')).not.toContainText('Nível');
    await expect(page.locator('#pprev')).not.toContainText('teste#1234');

    await page.evaluate(() => {
        profile.privacy = { ...profile.privacy, level: true, links: true };
        saveProfile();
        renderProfileView();
        renderSideCard();
    });
    await expect(page.locator('#pvId')).toContainText('Nível');
    await expect(page.locator('#pprev')).toContainText('teste#1234');

    await page.evaluate(() => {
        profile.privacy = { ...profile.privacy, level: false, links: false };
        saveProfile();
        renderProfileView();
        renderSideCard();
    });
    await page.locator('#pvPreview').click();
    await expect(page.locator('#shareModal')).toHaveClass(/show/);
    await expect(page.locator('#shareModalBox')).toContainText('Prévia pública');
    await expect(page.locator('#shareModalBox')).toContainText('Teste Automático');
    await expect(page.locator('#shareModalBox .pcard')).not.toContainText('Nível');
});

test('QR Code do cartão é gerado', async ({ page }) => {
    await abrirPerfil(page);
    await page.evaluate(() => {
        pTab = 'card';
        renderPTabs();
        renderForm();
    });
    await expect(page.locator('#qrPreview canvas')).toHaveCount(1);
    const tamanho = await page.locator('#qrPreview canvas').evaluate(c => [c.width, c.height]);
    expect(tamanho[0]).toBeGreaterThan(100);
    expect(tamanho[1]).toBe(tamanho[0]);
});

test('link compartilhado abre o cartão com a privacidade aplicada', async ({ page }) => {
    const url = await page.evaluate(() => {
        profile.nick = 'Compartilhado Teste';
        profile.links.discord = 'discordteste';
        profile.privacy = { ...profile.privacy, level: true, links: false };
        saveProfile();
        return profileShareURL();
    });
    await page.goto(url);
    await expect(page.locator('#shareModal')).toHaveClass(/show/);
    await expect(page.locator('#shareModalBox')).toContainText('Compartilhado Teste');
    await expect(page.locator('#shareModalBox .pcard')).toContainText('Nível');
    await expect(page.locator('#shareModalBox .pcard')).not.toContainText('discordteste');
});

test('comparação com até 3 links, cartão e texto', async ({ page }) => {
    const links = await page.evaluate(() => {
        profile.nick = 'Eu Teste';
        profile.mains = ['Abrams'];
        saveProfile();
        return [
            profileShareURL({ ...profile, nick: 'Amigo A', mains: ['Abrams'] }),
            profileShareURL({ ...profile, nick: 'Amigo B', mains: ['Bebop'] })
        ];
    });

    await abrirPerfil(page);
    await page.evaluate(() => {
        pTab = 'data';
        renderPTabs();
        renderForm();
    });
    await page.locator('#compareLink').fill(links.join('\n'));
    await page.locator('[data-act="compare"]').click();
    await expect(page.locator('.compare-box')).toHaveCount(2);
    await expect(page.locator('.compare-tools')).toContainText('Copiar comparação');

    await page.locator('[data-act="compare-card"]').first().click();
    await expect(page.locator('#shareModalBox')).toContainText('Cartão de Amigo A');
    await page.locator('#shareModalBox [data-close="shareModal"]').first().click();

    await page.evaluate(() => {
        window.__cartoes = [];
        window.__baixarPngOriginal = window.baixarPng;
        window.baixarPng = (canvas, p, sufixo) => window.__cartoes.push([sufixo, canvas.width, canvas.height, p.nick]);
    });
    await page.locator('[data-act="compare-download"]').first().click();
    await page.waitForFunction(() => window.__cartoes.length === 1);
    expect(await page.evaluate(() => window.__cartoes[0])).toEqual(['', 1000, 600, 'Amigo A']);
    await page.evaluate(() => { window.baixarPng = window.__baixarPngOriginal; });

    await page.locator('[data-act="compare-copy"]').click();
    const texto = await page.evaluate(() => navigator.clipboard.readText());
    expect(texto).toContain('Amigo A');
    expect(texto).toContain('Amigo B');
});

test('presets: salvar, renomear, duplicar, padrão e aplicar', async ({ page }) => {
    await abrirPerfil(page);
    await page.evaluate(() => {
        pTab = 'card';
        renderPTabs();
        renderForm();
        document.querySelector('#presetName').value = 'Neon';
        document.querySelector('[data-act="preset-save"]').click();
    });
    await expect(page.locator('.preset-item')).toHaveCount(1);
    await expect(page.locator('.preset-badge')).toHaveCount(1);

    page.once('dialog', dialog => dialog.accept('Neon Renomeado'));
    await page.locator('[data-act="preset-rename"]').first().click();
    await expect(page.locator('.preset-item .preset-info b').first()).toContainText('Neon Renomeado');

    await page.locator('[data-act="preset-duplicate"]').first().click();
    await expect(page.locator('.preset-item')).toHaveCount(2);
    await expect(page.locator('.preset-item .preset-info b').nth(1)).toContainText('cópia');

    await page.locator('[data-act="preset-default"]').nth(1).click();
    await expect(page.locator('.preset-item').nth(1)).toHaveClass(/is-default/);
    await expect(page.locator('.preset-item').nth(0)).not.toHaveClass(/is-default/);
    await expect(page.locator('[data-act="preset-default-apply"]')).toContainText('Neon Renomeado cópia');
});

test('minhas builds: reordenar, principal, filtro e link direto', async ({ page }) => {
    const ids = await page.evaluate(() => {
        profile.savedBuilds = [BUILDS[0].id, BUILDS[1].id];
        saveProfile();
        return profile.savedBuilds.slice();
    });
    await abrirPerfil(page);
    await page.evaluate(() => {
        pTab = 'game';
        renderPTabs();
        renderForm();
    });
    await expect(page.locator('.showcase-slot')).toHaveCount(2);

    await page.locator('[data-act="savedbuild-down"]').first().click();
    expect(await page.evaluate(() => profile.savedBuilds[0])).toBe(ids[1]);

    await page.locator('[data-act="savedbuild-main"]').last().click();
    expect(await page.evaluate(() => profile.savedBuilds[0])).toBe(ids[0]);

    const heroi = await page.evaluate(() => buildHeroName(BUILDS[0]));
    await page.selectOption('#savedBuildHero', heroi);
    const opcoes = await page.locator('#savedBuildPick option').allTextContents();
    expect(opcoes.length).toBeGreaterThan(0);
    for (const texto of opcoes) expect(texto).toContain(heroi);

    await page.locator('[data-act="savedbuild-copy"]').first().click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toContain('#build=');

    const id = await page.evaluate(() => BUILDS[0].id);
    await page.goto('/#build=' + encodeURIComponent(id));
    await expect(page.locator('#contentModal')).toHaveClass(/show/);
    await expect(page.locator('#contentModalBox')).toContainText('Build');
});

test('os quatro PNGs são gerados nos tamanhos certos', async ({ page }) => {
    const cartoes = await page.evaluate(async () => {
        profile.av.img = '';
        profile.bannerImg = '';
        profile.mains = [];
        profile.showcase = [];
        const original = window.baixarPng;
        const saida = [];
        window.baixarPng = (canvas, p, sufixo) => saida.push([sufixo, canvas.width, canvas.height]);
        await downloadCard('paisagem');
        await downloadCard('story');
        await downloadCard('quadrado');
        await downloadCard('banner');
        window.baixarPng = original;
        return saida;
    });
    expect(cartoes).toEqual([
        ['', 1000, 600],
        ['story', 1080, 1920],
        ['quadrado', 1080, 1080],
        ['banner', 1500, 500]
    ]);
});

test('o botão Baixar cartão entrega um PNG de verdade', async ({ page }) => {
    await abrirPerfil(page);
    await page.evaluate(() => {
        profile.nick = 'Teste Download';
        saveProfile();
        applyProfile();
    });
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#pvDl').click()
    ]);
    expect(download.suggestedFilename()).toBe('Teste_Download-central-deadlock.png');
    const caminho = await download.path();
    const dados = fs.readFileSync(caminho);
    expect(dados.length).toBeGreaterThan(50000);
    expect(dados.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

test('cartão com banner grande continua baixando', async ({ page }) => {
    await abrirPerfil(page);
    await page.evaluate(() => {
        const c = document.createElement('canvas');
        c.width = 1600; c.height = 900;
        const ctx = c.getContext('2d');
        const img = ctx.createImageData(c.width, c.height);
        for (let i = 0; i < img.data.length; i += 4) {
            img.data[i] = Math.random() * 255;
            img.data[i + 1] = Math.random() * 255;
            img.data[i + 2] = Math.random() * 255;
            img.data[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        profile.nick = 'Banner Grande';
        profile.bannerImg = c.toDataURL('image/jpeg', 0.9);
        saveProfile();
        applyProfile();
    });
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#pvDl').click()
    ]);
    const dados = fs.readFileSync(await download.path());
    expect(dados.length).toBeGreaterThan(50000);
    expect(dados.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

test('item da vitrine com imagem externa continua baixando (CORS)', async ({ page }) => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.route('https://cdn.exemplo.test/**', route => route.fulfill({
        status: 200,
        headers: { 'content-type': 'image/png', 'access-control-allow-origin': '*' },
        body: png
    }));
    await abrirPerfil(page);
    await page.evaluate(() => {
        const itens = window.GAME_DATA.itens;
        const id = Object.keys(itens)[0];
        itens[id].i = 'https://cdn.exemplo.test/item.png';
        profile.nick = 'Item Externo';
        profile.showcase = [{ type: 'item', id }];
        profile.cardShowcase = true;
        saveProfile();
        applyProfile();
    });
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#pvDl').click()
    ]);
    const dados = fs.readFileSync(await download.path());
    expect(dados.length).toBeGreaterThan(50000);
    expect(dados.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

test('imagem externa sem CORS não impede o download do cartão', async ({ page }) => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.route('https://cdn.sem-cors.test/**', route => route.fulfill({
        status: 200,
        headers: { 'content-type': 'image/png' },
        body: png
    }));
    await abrirPerfil(page);
    await page.evaluate(() => {
        const itens = window.GAME_DATA.itens;
        const id = Object.keys(itens)[0];
        itens[id].i = 'https://cdn.sem-cors.test/item.png';
        profile.nick = 'Sem CORS';
        profile.showcase = [{ type: 'item', id }];
        profile.cardShowcase = true;
        saveProfile();
        applyProfile();
    });
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#pvDl').click()
    ]);
    const dados = fs.readFileSync(await download.path());
    expect(dados.length).toBeGreaterThan(50000);
    expect(dados.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

test('cartão contaminado é refeito sem imagens externas', async ({ page }) => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.route('https://cdn.sem-cors.test/**', route => route.fulfill({
        status: 200,
        headers: { 'content-type': 'image/png' },
        body: png
    }));
    await abrirPerfil(page);
    const r = await page.evaluate(async () => {
        // Imagem de outro site carregada sem CORS "suja" o canvas de propósito.
        const c = document.createElement('canvas');
        c.width = 10; c.height = 10;
        const ctx = c.getContext('2d');
        const im = new Image();
        await new Promise(ok => { im.onload = ok; im.onerror = ok; im.src = 'https://cdn.sem-cors.test/taint.png'; });
        try { ctx.drawImage(im, 0, 0); } catch (e) { }
        let erro = null;
        try { baixarPng(c, profile, ''); } catch (e) { erro = e.name; }
        const original = window.downloadCard;
        let chamadas = 0;
        window.downloadCard = async () => {
            chamadas++;
            if (chamadas === 1) { const falha = new Error('contaminado'); falha.name = 'SecurityError'; throw falha; }
        };
        await baixarCartaoComSeguranca('paisagem');
        window.downloadCard = original;
        return { erro, chamadas, externasLiberadas: imagensExternasPermitidas };
    });
    expect(r.erro).toBe('SecurityError');
    expect(r.chamadas).toBe(2);
    expect(r.externasLiberadas).toBe(true);
});

test('comparação tem link compartilhável e cartão PNG', async ({ page }) => {
    await page.goto('/#comparar=' + encodeURIComponent('Abrams') + ',' + encodeURIComponent('Bebop'));
    await page.waitForFunction(() => typeof showSection === 'function' && typeof heroByName === 'function');
    await expect(page.locator('#comparar')).toHaveClass(/active/);
    await expect(page.locator('#cmpA')).toHaveValue('Abrams');
    await expect(page.locator('#cmpB')).toHaveValue('Bebop');
    await page.locator('#cmpShare').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('#comparar=Abrams,Bebop');
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#cmpDownload').click()
    ]);
    expect(download.suggestedFilename()).toContain('comparacao-abrams-vs-bebop');
    const dados = fs.readFileSync(await download.path());
    expect(dados.length).toBeGreaterThan(50000);
    expect(dados.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

test('copiar build gera o texto com a ordem dos itens', async ({ page }) => {
    const info = await page.evaluate(() => {
        const a = BUILDS.find(x => x.builds && x.builds.length);
        return {
            id: a.id,
            primeiro: itemDe(a.builds[0].itens[0]).n,
            win: String(a.builds[0].win).replace('.', ',')
        };
    });
    await page.goto('/#build=' + encodeURIComponent(info.id));
    await expect(page.locator('#contentModal')).toHaveClass(/show/);
    await page.locator('[data-copy-build]').first().click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Ordem de compra:');
    const copiado = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiado).toContain(info.primeiro);
    expect(copiado).toContain('Win rate: ' + info.win + '%');
});

test('evento futuro oferece arquivo de calendário (.ics)', async ({ page }) => {
    await page.evaluate(() => showSection('eventos'));
    await page.waitForSelector('.event-item');
    const tem = await page.locator('.event-item.futuro [data-calendar]').count();
    test.skip(!tem, 'sem torneio futuro nos dados de teste');
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('.event-item.futuro [data-calendar]').first().click()
    ]);
    expect(download.suggestedFilename()).toMatch(/\.ics$/);
    const texto = fs.readFileSync(await download.path(), 'utf8');
    expect(texto).toContain('BEGIN:VCALENDAR');
    expect(texto).toContain('BEGIN:VEVENT');
    expect(texto).toContain('DTSTART;VALUE=DATE:');
    expect(texto).toContain('SUMMARY:Deadlock: ');
    expect(texto).toContain('END:VCALENDAR');
    await page.waitForTimeout(350);
    await expect(page.locator('#contentModal')).not.toHaveClass(/show/);
});

test('ranking mostra jogadores e avisa quando usa a temporada anterior', async ({ page }) => {
    await page.evaluate(() => showSection('ranking'));
    await expect(page.locator('#rankTable .ranking-row').first()).toBeVisible();
    await expect(page.locator('#rankFonte')).toContainText('jogadores');
    await expect(page.locator('#rankNota')).toContainText(/temporada/i);

    // Nenhuma região pode abrir uma tabela vazia: ou tem linhas, ou tem aviso.
    const regioes = await page.locator('[data-rankreg]').evaluateAll(botoes => botoes.map(b => b.dataset.rankreg));
    for (const regiao of regioes) {
        await page.locator(`[data-rankreg="${regiao}"]`).click();
        const linhas = await page.locator('#rankTable .ranking-row').count();
        const aviso = await page.locator('#rankTable .muted-txt').count();
        expect(linhas + aviso).toBeGreaterThan(0);
        if (linhas === 0) {
            await expect(page.locator('#rankTable')).toContainText('Ainda não há jogadores');
        }
    }
});

test('acessibilidade básica e sem erros de página', async ({ page }) => {
    const erros = [];
    page.on('pageerror', erro => erros.push(erro.message));
    await page.goto('/');
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#conteudo');
    expect(await page.locator('img:not([alt])').count()).toBe(0);
    await abrirPerfil(page);
    await expect(page.getByRole('button', { name: /Ver como visitante/ }).first()).toBeVisible();
    expect(erros).toEqual([]);
});

test.describe('celular', () => {
    test.use({ viewport: { width: 360, height: 800 } });

    test('não tem rolagem horizontal e os botões continuam legíveis', async ({ page }) => {
        await abrirPerfil(page);
        const excesso = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(excesso).toBeLessThanOrEqual(1);
        await expect(page.locator('#pvPreview')).toBeVisible();
        await expect(page.locator('#pvPreview')).toContainText('Ver como visitante');
    });
});
