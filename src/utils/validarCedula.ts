/**
 * Valida una cédula ecuatoriana de persona natural usando el algoritmo
 * oficial de módulo 10.
 *
 * Reglas aplicadas:
 * - Debe tener exactamente 10 dígitos numéricos.
 * - Los dos primeros dígitos (provincia) deben estar entre 01 y 24.
 * - El tercer dígito debe estar entre 0 y 5 (persona natural).
 * - El dígito verificador debe coincidir con el cálculo módulo 10.
 */
export function validarCedula(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  const provincia = Number(cedula.slice(0, 2));
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  const tercerDigito = Number(cedula[2]);
  if (tercerDigito < 0 || tercerDigito > 5) {
    return false;
  }

  let suma = 0;

  for (let index = 0; index < 9; index += 1) {
    let valor = Number(cedula[index]);

    if (index % 2 === 0) {
      valor *= 2;
      if (valor > 9) {
        valor -= 9;
      }
    }

    suma += valor;
  }

  const digitoVerificadorEsperado = (10 - (suma % 10)) % 10;
  const digitoVerificadorActual = Number(cedula[9]);

  return digitoVerificadorEsperado === digitoVerificadorActual;
}

export function normalizarCedula(cedula: string): string {
  return cedula.replace(/\D/g, "").slice(0, 10);
}
