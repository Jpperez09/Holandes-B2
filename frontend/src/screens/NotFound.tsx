import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export function NotFound(): React.JSX.Element {
  return (
    <EmptyState
      icon="🧭"
      title="This page doesn't exist"
      message="Let's get you back on track."
      action={
        <Link className="btn btn--primary" to="/">
          Go home
        </Link>
      }
    />
  );
}
