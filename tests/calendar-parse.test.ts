import { describe, expect, it } from 'vitest';
import { decodeEntities, htmlToText, parseBondsPage, parseKeyRatePage } from '../src/entities/calendar/model/parse';
import { countdownLabel, daysUntil, ruToIso } from '../src/entities/calendar/model/dates';

const bonds = `<p>1156 событий</p><a>Все</a><a>Купоны</a><a>Амортизация</a><a>Погашения</a>
<section><h3>08.10.2026</h3><!-- --><span>2 выплат</span><ul>
<li><span>Купон</span><a href="/tools/bonds/RU000A106XD7">SELGOLD002</a><span>RU000A106XD7 · RU000A106XD7</span><div><strong>137,94<!-- --> ₽</strong><span>на одну бумагу</span></div><div>Дата фиксации<strong>07.10.2026</strong></div></li>
<li><span>Погашение</span><a href="/tools/bonds/RU000A10FS49">ВЭБ2Р-К752</a><span>RU000A10FS49 · RU000A10FS49</span><div><strong>1&nbsp;000,00 ₽</strong><span>на одну бумагу</span></div><div>Дата фиксации<strong>—</strong></div></li>
</ul></section><section><h3>09.10.2026</h3><span>1 выплата</span><ul><li><span>Купон</span><a>О&#x27;КЕЙ Б1Р2</a><span>RU000A1009Z8 · RU000A1009Z8</span><div><strong>24,93 ₽</strong> на одну бумагу</div><div>Дата фиксации <strong>08.10.2026</strong></div></li></ul></section><p>Страница 1 из 20</p>`;

describe('календари: разбор страниц сайта (пока нет API)', () => {
  it('облигации: события, суммы, даты, страницы; подписи фильтров не принимаются за события', () => {
    const r = parseBondsPage(bonds);
    expect(r.events).toHaveLength(3);
    expect(r.events[0]).toMatchObject({ type: 'coupon', name: 'SELGOLD002', amount: 137.94, payDate: '2026-10-08', recordDate: '2026-10-07' });
    expect(r.events[1]).toMatchObject({ type: 'redemption', amount: 1000, recordDate: null });
    expect(r.events[2]).toMatchObject({ name: "О'КЕЙ Б1Р2", payDate: '2026-10-09' });
    expect(r).toMatchObject({ totalEvents: 1156, page: 1, totalPages: 20 });
  });
  it('ключевая ставка: дата, подпись, заголовок, описание; подвал с новостями отсекается', () => {
    const html = `<h2>Предстоящие события</h2><ol><li><span>23.10.2026</span><span>Решение по ставке</span><h3>Заседание Банка России по ключевой ставке</h3><p>Публикация в 13:30.</p></li><li><time>05.11.2026</time><em>После заседания</em><h3>Резюме обсуждения</h3><p>Время не указано.</p></li></ol><p>Источник: ЦБ</p><footer><h3>Новости</h3><p>13:33 08.10.2026</p></footer>`;
    const r = parseKeyRatePage(html);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ date: '2026-10-23', label: 'Решение по ставке', title: 'Заседание Банка России по ключевой ставке' });
  });
  it('служебное: комментарии React, сущности, даты', () => {
    expect(htmlToText('137,94<!-- --> ₽')).toBe('137,94 ₽');
    expect(decodeEntities('О&#x27;КЕЙ &amp; 1&nbsp;000')).toBe("О'КЕЙ & 1 000");
    expect(ruToIso('23.10.2026')).toBe('2026-10-23');
    expect(daysUntil('2026-10-23', new Date(2026, 9, 8))).toBe(15);
    expect(countdownLabel(1)).toBe('завтра');
  });
});
