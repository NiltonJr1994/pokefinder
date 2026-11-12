# Map coordinate references / Referências das coordenadas

Coordinate facts in `src/data/map-reference.json` are extracted/adapted from RainingChain/pokemoncompletion (GPL-3.0, accompanying `src/data/map-reference.LICENSE`). The app-specific coordinate conversion and correction script were written independently. Modified subset: only names, locations, coordinates and reference identifiers are retained. No web engine code is executed or embedded.

- https://github.com/RainingChain/pokemoncompletion
- https://pokemoncompletion.com/completion/Yellow
- https://pokemoncompletion.com/completion/Crystal
- https://pokemoncompletion.com/completion/Emerald
- Yellow and Crystal map artwork: ZaidusRecon, as credited by the reference site.
- Emerald map artwork and icon placement: Jaxson Keenes, as credited by the reference site.
- https://bulbapedia.bulbagarden.net/wiki/Viridian_City
- https://bulbapedia.bulbagarden.net/wiki/Appendix:HeartGold_and_SoulSilver_walkthrough/Section_2
- https://www.serebii.net/pokearth/johto/route30.shtml
- Existing edition-specific encounter data: https://github.com/PokeAPI/pokeapi

## Conversão e limites / Conversion and limits

Leaflet positions are `[latitude, longitude]` in CRS.Simple. The logical coordinates used by the bundled maps are `[longitude, -latitude]`. Yellow's full-image origin differs from its tile set by 28 logical vertical pixels: subtract 28 from the Y coordinate. Crystal and Emerald use zero offset. Every background crop and its markers are projected through the same rectangle, preserving aspect ratio.

Wild Pokémon pins represent encounter areas rather than exact spawn tiles. Source area association uses the recorded species community and nearby reference positions; this is an association derived from source data, not a new survey of every tile. These associations still require gameplay review. Remake-specific item, NPC and objective tiles are not copied from older-generation layouts. Actions without verified coordinates remain in the Journal with progress and notes intact. Existing region artwork remains a reference from Yellow/Crystal/Emerald; this correction does not replace every map with edition-specific artwork or provide complete floor-by-floor coverage.

Os pontos de Pokémon selvagens representam áreas de ocorrência, não posições fixas. A associação de áreas é derivada dos conjuntos de espécies e das posições da referência, e ainda requer conferência durante o jogo. Coordenadas de itens, NPCs e objetivos dos remakes não são copiadas de plantas de gerações antigas. Ações sem coordenadas confirmadas permanecem no Diário. As imagens continuam sendo bases de referência de Yellow/Crystal/Emerald; não há cobertura completa de cada interior de cada edição.

Run `python scripts/correct-map-coordinates.py` to reproduce the generated corrections and coordinate audit from the checked-in inputs. `npm run check` validates reference conversion, image aspect ratio, catalog parity and migration of personal pins without changing their world position.
