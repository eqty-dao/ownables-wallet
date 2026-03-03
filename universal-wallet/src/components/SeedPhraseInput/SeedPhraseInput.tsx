import React, { useContext } from 'react';
import styled from 'styled-components/native';
import { Clipboard } from 'react-native';
import { useClipboard } from '@react-native-clipboard/clipboard';
import { MessageContext } from '../../context/UserMessage.context';



const SeedPhraseContainer = styled.View`
  background-color: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
`;

const HeaderContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
`;

const ButtonsContainer = styled.View`
  flex-direction: row;
  gap: 8px;
`;

const SeedPhraseTitle = styled.Text`
  color: #ffffff;
  font-size: 18px;
`;

const ActionButton = styled.TouchableOpacity`
  background-color: #2a2a2a;
  padding: 8px 12px;
  border-radius: 6px;
`;

const ActionButtonText = styled.Text`
  color: #4a9eff;
  font-size: 14px;
`;

const WordsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
`;

const WordContainer = styled.View`
  width: 23%;
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 12px 8px;
  margin-bottom: 10px;
`;

const WordInput = styled.TextInput`
  color: #ffffff;
  font-size: 14px;
  text-align: center;
`;

interface SeedPhraseInputProps {
    words: string[];
    onWordChange: (text: string, index: number) => void;
    showCopyButton: boolean;
    onPaste: (phrase: string) => void;
    showPasteButton: boolean;
}

export const SeedPhraseInput: React.FC<SeedPhraseInputProps> = ({
    words,
    onWordChange,
    showCopyButton = false,
    onPaste,
    showPasteButton = false
}) => {
    const [, setString] = useClipboard();
    const { setShowMessage, setMessageInfo } = useContext(MessageContext);

    const handleCopy = () => {
        const seedPhrase = words.join(' ').trim();
        setString(seedPhrase);
        setShowMessage(true);
        setMessageInfo('Seed phrase copied to clipboard!');
    };

    const handlePaste = () => {
        Clipboard.getString().then((text) => {
            const length = text.split(' ').length;
            if (!text || text === '' || text === 'showCopyButton' || text === 'onCopy' || text === 'onPaste' || text === 'showPasteButton') {
                setShowMessage(true);
                setMessageInfo('No seed phrase found in clipboard.');
                return;
            } else if (length < 12) {
                setShowMessage(true);
                setMessageInfo('Incorrect seed phrase length.');
                return;
            } else {
                onPaste(text);
                setShowMessage(true);
                setMessageInfo('Seed phrase pasted from clipboard!');
            }
        });
    };



    return (
        <SeedPhraseContainer>
            <HeaderContainer>
                <SeedPhraseTitle>Secret Recovery Phrase</SeedPhraseTitle>
                <ButtonsContainer>
                    {showPasteButton && (
                        <ActionButton onPress={handlePaste}>
                            <ActionButtonText>Paste</ActionButtonText>
                        </ActionButton>
                    )}
                    {showCopyButton && (
                        <ActionButton onPress={handleCopy}>
                            <ActionButtonText>Copy</ActionButtonText>
                        </ActionButton>
                    )}
                </ButtonsContainer>
            </HeaderContainer>
            <WordsGrid>
                {words.map((word, index) => (
                    <WordContainer key={index}>
                        <WordInput
                            value={word}
                            onChangeText={(text) => onWordChange(text, index)}
                            placeholder={`word ${index + 1}`}
                            placeholderTextColor="#666666"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!showCopyButton}
                        />
                    </WordContainer>
                ))}
            </WordsGrid>
        </SeedPhraseContainer>
    );
}; 
