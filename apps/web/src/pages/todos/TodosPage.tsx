import { Share2Icon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './TodosPage.module.css';

const todoLists = [
  {
    title: 'Shopping cart',
    items: [
      { done: false, text: 'Oats and Greek yogurt' },
      { done: true, text: 'Coffee beans' },
      { done: false, text: 'Vegetables for stir-fry' },
      { done: false, text: 'Cat food' },
    ],
  },
  {
    title: 'Life goals',
    items: [
      { done: true, text: 'Renew passport' },
      { done: false, text: 'Plan the balcony garden' },
      { done: false, text: 'Book a Polish conversation class' },
    ],
  },
] as const;

export function TodosPage() {
  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Todos</h1>
          <p>Simple checklists for your shopping cart and life goals.</p>
        </div>
        <Btn
          disabled
          icon={<Share2Icon aria-hidden='true' />}
          radius='pill'
          type='button'
          variant='outlineMain'
        >
          Share soon
        </Btn>
      </header>

      <p className={css.mockNote}>Mock only — editing and sharing are coming next.</p>

      <section aria-label='Example todo lists' className={css.listGrid}>
        {todoLists.map((list) => (
          <Card as='article' className={css.listCard} key={list.title}>
            <h2>{list.title}</h2>
            <ul className={css.items}>
              {list.items.map((item) => (
                <li className={css.item} key={item.text}>
                  <input defaultChecked={item.done} disabled type='checkbox' />
                  <span className={item.done ? css.done : undefined}>{item.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </section>
    </main>
  );
}
