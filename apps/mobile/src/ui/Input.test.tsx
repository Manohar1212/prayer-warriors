import { fireEvent, render, screen } from '@testing-library/react-native';

import { Input } from './Input';

describe('Input', () => {
  it('renders label and forwards text changes', async () => {
    const onChangeText = jest.fn();
    await render(
      <Input label="Email" placeholder="you@example.com" onChangeText={onChangeText} />,
    );
    expect(screen.getByText('Email')).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'a@b.c');
    expect(onChangeText).toHaveBeenCalledWith('a@b.c');
  });

  it('shows an error message when given', async () => {
    await render(<Input label="Password" error="Incorrect email or password." />);
    expect(screen.getByText('Incorrect email or password.')).toBeTruthy();
  });
});
