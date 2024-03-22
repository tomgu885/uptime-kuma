// https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81#file-crypto-aes-256-gcm-demo-js-L36

const aes256gcm = (key) => {
    const ALGO = 'aes-256-gcm';

    // encrypt returns base64-encoded ciphertext
    const encrypt = (str) => {
        // The `iv` for a given key must be globally unique to prevent
        // against forgery attacks. `randomBytes` is convenient for
        // demonstration but a poor way to achieve this in practice.
        //
        // See: e.g. https://csrc.nist.gov/publications/detail/sp/800-38d/final
        const iv = new Buffer(crypto.randomBytes(12), 'utf8');
        const cipher = crypto.createCipheriv(ALGO, key, iv);

        // Hint: Larger inputs (it's GCM, after all!) should use the stream API
        let enc = cipher.update(str, 'utf8', 'base64');
        enc += cipher.final('base64');
        return [enc, iv, cipher.getAuthTag()];
    };

    // decrypt decodes base64-encoded ciphertext into a utf8-encoded string
    const decrypt = (enc, iv, authTag) => {
        const decipher = crypto.createDecipheriv(ALGO, key, iv);
        decipher.setAuthTag(authTag);
        let str = decipher.update(enc, 'base64', 'utf8');
        str += decipher.final('utf8');
        return str;
    };

    return {
        encrypt,
        decrypt,
    };
};

module.exports = {
    aes256gcm,
}
