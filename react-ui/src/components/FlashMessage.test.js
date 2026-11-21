import React from 'react';
import { render, screen } from '@testing-library/react';
import FlashMessage from './FlashMessage';

describe('FlashMessage', () => {
  it('shows the message when visible', () => {
    const { container } = render(<FlashMessage showFlashMsg flashMsg="Artist added!" />);
    expect(screen.getByText('Artist added!')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('flash-msg', 'show');
  });

  it('renders nothing when hidden', () => {
    const { container } = render(<FlashMessage showFlashMsg={false} flashMsg="hi" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without a message', () => {
    const { container } = render(<FlashMessage showFlashMsg flashMsg={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
