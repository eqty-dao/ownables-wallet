import React from 'react';
import renderer from 'react-test-renderer';
import ImportSeedScreen from '../src/screens/ImportWithSeedScreen/ImportWithSeedScreen';
import { MessageContext } from '../src/context/UserMessage.context';

const mockImportAccount = jest.fn();
const mockSeedPhraseInput = jest.fn(() => null);
const mockStyledButton = jest.fn(() => null);

jest.mock('../src/services/AccountLifecycle.service', () => ({
  __esModule: true,
  default: {
    importAccount: (...args: unknown[]) => mockImportAccount(...args),
  },
}));

jest.mock('../src/components/ScreenContainer', () => ({
  ScreenContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../src/components/Title', () => ({
  Title: () => null,
}));

jest.mock('../src/components/BackButton', () => ({
  BackButton: () => null,
}));

jest.mock('../src/components/SeedPhraseInput/SeedPhraseInput', () => ({
  SeedPhraseInput: (props: unknown) => mockSeedPhraseInput(props),
}));

jest.mock('../src/components/StyledButton', () => ({
  StyledButton: (props: unknown) => mockStyledButton(props),
}));

describe('ImportWithSeedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockImportAccount.mockResolvedValue(undefined);
  });

  it('imports 12-word recovery phrase and navigates to RegisterAccount', async () => {
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    const setShowMessage = jest.fn();
    const setMessageInfo = jest.fn();

    await renderer.act(async () => {
      renderer.create(
        <MessageContext.Provider value={{ showMessage: false, messageInfo: '', setShowMessage, setMessageInfo }}>
          <ImportSeedScreen navigation={navigation as any} route={{ key: 'ImportSeed', name: 'ImportSeed' } as any} />
        </MessageContext.Provider>,
      );
    });

    const words = [
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'abandon',
      'about',
    ];

    for (let idx = 0; idx < words.length; idx += 1) {
      const currentSeedInputProps = mockSeedPhraseInput.mock.calls.at(-1)?.[0] as {
        onWordChange: (text: string, index: number) => void;
      };
      await renderer.act(async () => {
        currentSeedInputProps.onWordChange(words[idx], idx);
      });
    }

    const latestButtonProps = mockStyledButton.mock.calls.at(-1)?.[0] as { onPress: () => Promise<void> | void };

    await renderer.act(async () => {
      await latestButtonProps.onPress();
    });

    expect(mockImportAccount).toHaveBeenCalledWith(words.join(' '));
    expect(navigation.navigate).toHaveBeenCalledWith('RegisterAccount', { data: 'seed' });
    expect(setShowMessage).not.toHaveBeenCalledWith(true);
    expect(setMessageInfo).not.toHaveBeenCalledWith('Failed to import account. Please try again.');
  });
});
