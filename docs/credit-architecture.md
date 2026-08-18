# Arquitectura de créditos en preparación

Edu AI mantiene los pagos y canjes desactivados. La base incluye un saldo por cuenta y un libro mayor de movimientos para que una futura integración no tenga que reconstruir registros de compra, consumo, ajustes o reembolsos.

| Elemento | Estado | Regla actual |
|---|---|---|
| Cuenta de créditos | Preparada | Se asocia solo a una cuenta autenticada |
| Libro mayor | Preparado | Un movimiento conserva motivo, estado y referencia del proveedor |
| Paquetes | Informativos | 30, 60 y 120 créditos; 1 crédito representa 1.000 caracteres |
| Pago y canje | Desactivados | Requieren proveedor, precios, condiciones y aprobación explícita |

No se crean saldos, no se aplican cargos y no se descuentan créditos con esta versión.
