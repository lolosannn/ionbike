// Reseñas del local copiadas de Google Maps (texto tal cual lo dejó cada cliente).
// Para sumar una, agregarla a la lista; se reparten solas entre las dos filas del carrusel.
// Fotos: archivos en public/resenas/ con el nombre de `photos` (y `avatar` para la foto del cliente).
export type Review = { name: string; text: string; stars: number; localGuide?: boolean; avatar?: string; photos?: string[] };

export const reviews: Review[] = [
  {
    name: "Mariana Quintero", stars: 5, photos: ["mariana-quintero-1"],
    text: "Tengo mi primer bici Gravity 😳 Gracias a ionbikestore, la elección fue dificil ya q es una más linda q la otra. Pablo con su atencion y predisposición me ayudo. Estuvo en todo detalle. El lugar es muy confortable y la gente q trabaja ahi…",
  },
  {
    name: "Gonzalo Ruben Almarcha Paredes", stars: 5, avatar: "gonzalo-almarcha-avatar", photos: ["gonzalo-almarcha-1", "gonzalo-almarcha-2"],
    text: "Eternamente agradecido al equipo de IONBIKESTORE y principalmente a Pablo que me brindo desde un principio la mejor atención posible, ya que los contacte vía llamada desde San Juan y me ofrecieron una atención extra en el precio por pagar…",
  },
  {
    name: "Roman Machado", stars: 5, photos: ["roman-machado-1", "roman-machado-2"],
    text: "La verdad se pasaron con las bicis, Eydan súper contento y sinceramente me encantaron .. sobre todo muy buena onda y excelente servicio y precios !! 👌…",
  },
  {
    name: "Claudio Linares", stars: 5, avatar: "claudio-linares-avatar", photos: ["claudio-linares-1"],
    text: "Compré 2 bicicletas con el asesoramiento de Pablo y equipo. Mejor imposible, uso, cuidados, para bicicletear en familia. Super recomendables. Gracias!",
  },
  {
    name: "diego gonzalez", stars: 5, avatar: "diego-gonzalez-avatar", photos: ["diego-gonzalez-1", "diego-gonzalez-2"],
    text: "De 10. Me dedicaron todo el tiempo en explicarme la mejor opción. Me entregaron la bici en tiempo y forma. Muy recomendable",
  },
  {
    name: "emanuel damian sudañes", stars: 5, photos: ["emanuel-sudanes-1", "emanuel-sudanes-2"],
    text: "Excelente atencion y muy hermosas la bicicletas!!,.gracias ion bike y a pablo por guiarnos, explicando los componente de cada bici.para elegir la mejor y empezar una linda aventura con mi hija....",
  },
  {
    name: "Mariano", stars: 5, localGuide: true, photos: ["mariano-1", "mariano-2"],
    text: "Excelente las bicis de ION Bike!! A mí hijo le encantó la bici!! Pablo nos ayudó a elegir la mejor para él y nos explicó todo como es su funcionamiento, hasta nos ayudó a poner el porta bicicleta del auto y nos dió muchas recomendaciones para el viaje!! Súper recomendable!!! Ya estamos pensando en comprar otra!!",
  },
  {
    name: "Heber Tomás Aispuru", stars: 5, avatar: "heber-aispuru-avatar", photos: ["heber-aispuru-1", "heber-aispuru-2"],
    text: "Buenas, ya hace 3 semanas compre una Zion Strix y muy conforme. Contacte a la empresa por ML y luego los busque en Maps, llame y hable directamente con Pablo. En mi caso como vivo en CABA, fui a buscarla personalmente en un 208. Excelente…",
  },
  { name: "Valentin Ovalle", stars: 5, text: "Muy buena atención, el lugar super nuevo y novedoso. Bicis de todos los tipos a precios accesibles." },
  { name: "Leandro Alvarez", stars: 5, localGuide: true, text: "Muy buena calidad de bicicletas con variedad de opciones... Gracias por la atención y asesoramiento" },
  { name: "Comflex S.A.", stars: 5, text: "Muy buena la atención excelentes productos a muy buen precio." },
  { name: "Beatriz D'Alessandro", stars: 5, text: "Muy conforme con la atención y cumplimiento con la entrega en tiempo y forma!!" },
  { name: "Fernando Becerra", stars: 5, text: "Excelente atención y predisposición, calidad y precio 100% recomendable" },
  { name: "walter florencio", stars: 5, text: "Excelente atención y buen servicio post venta, altamente recomendable. Por más negocios que funcionen así!" },
  { name: "Laura baez acosta", stars: 5, localGuide: true, text: "Exelente lugar ; exelente trato y atención de cada uno de los integrantes del lugar super amables" },
  { name: "Andrea Alvarez", stars: 5, localGuide: true, text: "Muy buena atención , buenos productos y variedad de precios para cada bolsillo." },
  { name: "Luis Antonio Muñoz", stars: 5, text: "Realicé dos compras y llegaron muy rápido, responsables y de confianza para comprar." },
  { name: "franco gimenez", stars: 5, text: "Siempre con una atención y amabilidad de parte de todo su equipo para con el cliente !!!" },
  { name: "Damian Alejandro Barrionuevo Soto", stars: 5, text: "Excelente atención, amabilidad, profesionalismo, predisposición, garantía, entrega, etc." },
  { name: "sebastian bai", stars: 5, text: "Excelente atención y servicio. Salió todo mejor de lo que esperaba." },
];
