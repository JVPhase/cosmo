Что исправлено:

1. buy-credits — отключён (safety gate)
Вернули 403 с объяснением. Причина: сервер не имеет авторитетного кредитного кошелька — чтение баланса из userSave вне транзакции позволяет бесплатные покупки при конкурентных запросах. Чистое решение в рамках P0 невозможно, поэтому endpoint закрыт.

2. /telegram/shop/invoice — жёсткая проверка deliveryMode
Добавлена проверка itemMeta.deliveryMode !== 'grant_sync' → 400. Unsupported SKU теперь нельзя купить ни через каталог, ни прямым вызовом.

3. Дублирование Stars reward — убрано
onStarsPurchaseApplied в App.tsx больше не мутирует game state немедленно. Доставка — только через grant sync при следующем запуске. StarsShopTab и до этого показывал честный текст про «следующий запуск».

4. Bootstrap без существующего save — исправлен
Убран guard if (token && resolvedEnvelope). Grant sync теперь запускается при if (token). Свежий пользователь без save стартует с baseState = {}, grantBaseSeq = 0, получает grants, сохраняет, пушит, ackает.

5. Ad hoc AsyncStorage.setItem — убран
Заменён на saveGameEnvelope() из storage.ts. Добавлена функция в storage.ts. Прямой импорт AsyncStorage из App.tsx удалён.

Миграция 20260409160624_add_grant_model:
Это full-schema миграция (создаёт все таблицы, а не только Grant). В dev это работает, потому что предыдущая миграция создавала только GameConfig. Для production с существующей БД потребуется либо prisma migrate resolve --applied на все таблицы как baseline, либо рефакторинг в чистую additive миграцию (только CREATE TABLE "Grant" + индексы + FK). Менять в текущем рабочем дереве небезопасно без сброса dev-БД — оставлено как есть.

Acceptance criteria после фикса:

Критерий	Статус
server не пишет gameplay-поля в userSave	✅ (выполнено в прошлой сессии)
mobile — единственный writer gameplay-save	✅
sync только через Grant	✅
/telegram/me читает из envelope state	✅ (прошлая сессия)
/telegram/shop и /invoice пропускают только grant_sync	✅
unsupported premium unlocks недоступны	✅
reward не дублируется	✅
grant sync работает без существующего save	✅
local и cloud save используют один V2 envelope	✅
Сознательно за рамками P0: server-authoritative credit wallet, inline session grant polling, shared domain package, contract tests, production migration рефакторинг.