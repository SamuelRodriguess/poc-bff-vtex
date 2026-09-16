query {
  searchProducts (query: "piso"){
    total
    products {
      name
      price
      imageUrl
      link
    }
  }
}