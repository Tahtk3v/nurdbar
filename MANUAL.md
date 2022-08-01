# Nurdbar Manual

## Right Colom Actions
Press [ Tab ] till you see a cursor on the right side.

Enter your username or scan your barcode to [ login ].

If the bar changed to your name you are in.

After login you have 10 seconds to use one of the following functions:

### Casual
`````bash
# show balance
> balance

# deposit 10 euro
> deposit 10

# buy a product
> [scan the barcode of the product]

# buy another product
> [scan the barcode of the other product]
`````

### Advanced
`````bash
# add a user
> useradd foo

# withdraw 10 euro
> take 10

# give 10 euro to user foo
> give foo 10

# add a product to the product-database
> productadd 0123456789 Name of the product

# sell 20 bottles of mate to the bar for 1.50 per piece
> sell 012345789 20 1.50
`````

### IRC
`````text
~help
~barusers
~shame
~stock
~stock <name>
~search <name>

# user bound
~balance
~give <username-of-receiver> <amount[float]>
~buy <name of product>
~buy <amount[int]> <name of product>
~aliases
~aliasadd <alias>
~aliasremove <alias>
~useradd <username/ircnick>
~productadd <barcode> <name of product>
~sell <amount[int]> <name of product> <price[float]>
`````
