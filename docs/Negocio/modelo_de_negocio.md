# Modelo de Negocio — RentAI

## Propuesta de Valor

RentAI es una plataforma de **matching inteligente para arrendamiento estudiantil**. Conecta arrendatarios (estudiantes y jóvenes profesionales) con propietarios mediante un sistema de compatibilidad bilateral, reduciendo fricciones en la búsqueda de vivienda.

## Actores

### Arrendatario
- Busca habitación o compañero de cuarto (roommate)
- Desliza propiedades disponibles (swipe right = interés, swipe left = descarte)
- Solo puede chatear con propietarios que también los aceptaron (match bilateral)

### Propietario
- Publica su propiedad
- Ve la lista de arrendatarios interesados
- Acepta o ignora cada candidato
- Al aceptar un arrendatario que ya le dio like → se genera el match automáticamente

## Flujo de Match Bilateral

```
Arrendatario da like → Propietario ve interesados
                     → Propietario acepta → MATCH
                     → Chat habilitado entre ambos
```

> Un like del arrendatario NO es un match. El match requiere aceptación mutua.

## Diferenciador

A diferencia de portales de arriendo tradicionales (donde el arrendatario aplica y espera), RentAI da poder de selección a **ambas partes**, generando matches de mayor calidad y reduciendo contactos irrelevantes.

## Monetización (futuro)

- Plan premium para propietarios (más visibilidad, estadísticas)
- Comisión por contrato firmado a través de la plataforma
- Servicios adicionales (verificación de antecedentes, firma digital)
