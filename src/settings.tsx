import React from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { languages, type Language, useLocale } from './locale';
import { Card, Choice, CopyText, layout, useTheme } from './ui';

const themes = ['Sistema', 'Claro', 'Escuro'];
const languageByName = Object.fromEntries(Object.entries(languages).map(([code, name]) => [name, code as Language]));

export function Settings({ language, dark, onLanguage, onTheme, automatic, onAutomatic }: {
  language: Language; dark: boolean | null; onLanguage: (language: Language) => void; onTheme: (theme: boolean | null) => void;
  automatic: boolean; onAutomatic: (automatic: boolean) => void;
}) {
  const { tr } = useLocale();
  const t = useTheme();
  return <ScrollView style={layout.centered} contentContainerStyle={layout.list}>
    <CopyText kind="heading">Configurações</CopyText>
    <CopyText kind="muted">Aparência e idioma da interface.</CopyText>
    <Card>
      <CopyText kind="title">Idioma</CopyText>
      <Choice title="Idioma" value={languages[language] ?? languages['pt-BR']} options={Object.values(languages)}
        select={name => onLanguage(languageByName[name])} />
      <CopyText kind="muted">Textos do catálogo são exibidos no idioma de origem.</CopyText>
    </Card>
    <Card>
      <View style={layout.row}>
        <CopyText kind="title" style={layout.grow}>Verificação automática</CopyText>
        <Switch accessibilityLabel={tr('Verificação automática')} value={automatic} onValueChange={onAutomatic}
          trackColor={{ true: t.blue }} />
      </View>
    </Card>
    <Card>
      <CopyText kind="title">Tema</CopyText>
      <Choice title="Tema" value={dark === null ? 'Sistema' : dark ? 'Escuro' : 'Claro'} options={themes}
        select={value => onTheme(value === 'Sistema' ? null : value === 'Escuro')} />
    </Card>
  </ScrollView>;
}
