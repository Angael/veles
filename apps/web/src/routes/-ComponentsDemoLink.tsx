import { Link } from '@tanstack/react-router';
import css from './root.module.css';

export default function ComponentsDemoLink() {
  return (
    <Link className={css.demoLink} to='/demo/components'>
      Components demo
    </Link>
  );
}
